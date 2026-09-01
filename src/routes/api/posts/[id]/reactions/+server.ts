import { json } from "@sveltejs/kit";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "$lib/server/db";
import { post, postReaction } from "$lib/server/db/schema";
import { reactionSchema } from "$lib/validation";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db
    .select()
    .from(post)
    .where(and(eq(post.id, params.id), isNull(post.deletedAt)))
    .limit(1);

  if (existing.length === 0) return json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid emoji" }, { status: 400 });
  }

  try {
    await db.insert(postReaction).values({
      postId: params.id,
      userId: locals.user.id,
      emoji: parsed.data.emoji,
      createdAt: new Date(),
    });
  } catch {
    return json({ error: "Reaction already exists" }, { status: 409 });
  }

  const reactions = await db.select().from(postReaction).where(eq(postReaction.postId, params.id));
  return json({ reactions });
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Invalid emoji" }, { status: 400 });
  }

  await db
    .delete(postReaction)
    .where(
      and(
        eq(postReaction.postId, params.id),
        eq(postReaction.userId, locals.user.id),
        eq(postReaction.emoji, parsed.data.emoji)
      )
    );

  const reactions = await db.select().from(postReaction).where(eq(postReaction.postId, params.id));
  return json({ reactions });
};