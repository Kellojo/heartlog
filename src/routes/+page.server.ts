import { redirect } from "@sveltejs/kit";
import { desc, eq, inArray, isNull } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { post, postImage, postReaction, user } from "$lib/server/db/schema";

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, "/login");

  const limit = 20;

  const rows = await db
    .select()
    .from(post)
    .leftJoin(user, eq(post.authorId, user.id))
    .where(isNull(post.deletedAt))
    .orderBy(desc(post.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);

  const postIds = items.map((r) => r.post.id);

  const images =
    postIds.length > 0
      ? await db
          .select()
          .from(postImage)
          .where(inArray(postImage.postId, postIds))
      : [];

  const reactions =
    postIds.length > 0
      ? await db
          .select()
          .from(postReaction)
          .where(inArray(postReaction.postId, postIds))
      : [];

  const results = items.map((r) => ({
    ...r.post,
    author: r.user ? { id: r.user.id, name: r.user.name, image: r.user.image } : null,
    images: images.filter((img) => img.postId === r.post.id),
    reactions: reactions.filter((rxn) => rxn.postId === r.post.id),
  }));

  const nextCursor = hasMore ? String(results[results.length - 1].createdAt.getTime()) : null;

  return {
    initialPosts: results,
    nextCursor,
    hasMore,
    currentUser: {
      id: event.locals.user.id,
      name: event.locals.user.name,
      image: event.locals.user.image,
    },
  };
};