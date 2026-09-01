import { json } from "@sveltejs/kit";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import { post, postImage, postReaction, user } from "$lib/server/db/schema";
import { updatePostSchema } from "$lib/validation";
import { saveImage, getImagePath } from "$lib/server/uploads";
import fs from "node:fs";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const row = await db
    .select()
    .from(post)
    .leftJoin(user, eq(post.authorId, user.id))
    .where(and(eq(post.id, params.id), isNull(post.deletedAt)))
    .limit(1);

  if (row.length === 0) return json({ error: "Not found" }, { status: 404 });

  const images = await db.select().from(postImage).where(eq(postImage.postId, params.id));
  const reactions = await db.select().from(postReaction).where(eq(postReaction.postId, params.id));

  return json({
    ...row[0].post,
    author: row[0].user ? { id: row[0].user.id, name: row[0].user.name, image: row[0].user.image } : null,
    images,
    reactions,
  });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(post)
    .where(and(eq(post.id, params.id), isNull(post.deletedAt)))
    .limit(1);

  if (existing.length === 0) return json({ error: "Not found" }, { status: 404 });
  if (existing[0].authorId !== locals.user.id) return json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData();
  const title = formData.get("title")?.toString();
  const content = formData.get("content")?.toString();

  const parsed = updatePostSchema.safeParse({ title: title || null, content });
  if (!parsed.success) {
    return json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;

  await db.update(post).set(updateData).where(eq(post.id, params.id));

  const imageFiles = (formData.getAll("images").filter((f) => f instanceof File && (f as File).size > 0) as File[]);
  const removedImageIds = formData.getAll("removedImages").map((s) => s.toString()).filter(Boolean);

  if (removedImageIds.length > 0) {
    const imgsToDelete = await db.select().from(postImage).where(
      and(eq(postImage.postId, params.id), inArray(postImage.id, removedImageIds))
    );
    for (const img of imgsToDelete) {
      try { fs.unlinkSync(getImagePath(img.storagePath, "originals")); } catch {}
      try { fs.unlinkSync(getImagePath(img.thumbnailPath, "thumbnails")); } catch {}
    }
    await db.delete(postImage).where(
      and(eq(postImage.postId, params.id), inArray(postImage.id, removedImageIds))
    );
  }

  if (imageFiles.length > 0) {
    const currentImages = await db.select().from(postImage).where(eq(postImage.postId, params.id));
    let nextOrder = currentImages.length;
    const imageRecords = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const img = await saveImage(imageFiles[i]);
      imageRecords.push({
        postId: params.id,
        storagePath: img.storagePath,
        thumbnailPath: img.thumbnailPath,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        sortOrder: nextOrder + i,
      });
    }
    await db.insert(postImage).values(imageRecords);
  }

  return json({ success: true });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(post)
    .where(and(eq(post.id, params.id), isNull(post.deletedAt)))
    .limit(1);

  if (existing.length === 0) return json({ error: "Not found" }, { status: 404 });
  if (existing[0].authorId !== locals.user.id) return json({ error: "Forbidden" }, { status: 403 });

  await db.update(post).set({ deletedAt: new Date() }).where(eq(post.id, params.id));

  return json({ success: true });
};