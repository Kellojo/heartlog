import { json } from "@sveltejs/kit";
import { desc, eq, inArray, isNull, lt } from "drizzle-orm";
import { db } from "$lib/server/db";
import { post, postImage, postReaction, user } from "$lib/server/db/schema";
import { createPostSchema } from "$lib/validation";
import { saveImage } from "$lib/server/uploads";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") || "20"), 50);

  let query = db
    .select()
    .from(post)
    .leftJoin(user, eq(post.authorId, user.id))
    .where(isNull(post.deletedAt))
    .orderBy(desc(post.createdAt))
    .limit(limit + 1);

  if (cursor) {
    query = query.where(lt(post.createdAt, new Date(Number(cursor))));
  }

  const rows = await query;
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  const postIds = items.map((r) => r.post.id);

  const images =
    postIds.length > 0
      ? await db.select().from(postImage).where(inArray(postImage.postId, postIds))
      : [];

  const reactions =
    postIds.length > 0
      ? await db.select().from(postReaction).where(inArray(postReaction.postId, postIds))
      : [];

  const results = items.map((r) => ({
    ...r.post,
    author: r.user ? { id: r.user.id, name: r.user.name, image: r.user.image } : null,
    images: images.filter((img) => img.postId === r.post.id),
    reactions: reactions.filter((rxn) => rxn.postId === r.post.id),
  }));

  const nextCursor = hasMore ? String(items[items.length - 1].post.createdAt.getTime()) : null;

  return json({ posts: results, nextCursor, hasMore });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const title = formData.get("title")?.toString() || undefined;
  const content = formData.get("content")?.toString() || "";

  const parsed = createPostSchema.safeParse({ title, content });
  if (!parsed.success) {
    return json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  const imageFiles = (formData.getAll("images").filter((f) => f instanceof File && (f as File).size > 0) as File[]);

  if (imageFiles.length > 10) {
    return json({ error: "Maximum 10 images per post" }, { status: 400 });
  }

  const postId = crypto.randomUUID();
  const now = new Date();

  await db.insert(post).values({
    id: postId,
    authorId: locals.user.id,
    title: parsed.data.title || null,
    content: parsed.data.content,
    createdAt: now,
    updatedAt: now,
  });

  if (imageFiles.length > 0) {
    const imageRecords = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const img = await saveImage(imageFiles[i]);
      imageRecords.push({
        postId,
        storagePath: img.storagePath,
        thumbnailPath: img.thumbnailPath,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        sortOrder: i,
      });
    }
    await db.insert(postImage).values(imageRecords);
  }

  return json({ success: true, postId });
};