import { error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { postImage } from "$lib/server/db/schema";
import { getImagePath } from "$lib/server/uploads";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, url, locals }) => {
  if (!locals.user) throw error(401, "Unauthorized");

  const type = url.searchParams.get("type") || "originals";
  if (type !== "originals" && type !== "thumbnails") {
    throw error(400, "Invalid type");
  }

  const img = await db
    .select()
    .from(postImage)
    .where(eq(postImage.id, params.id))
    .limit(1);

  if (img.length === 0) throw error(404, "Image not found");

  const filename = type === "originals" ? img[0].storagePath : img[0].thumbnailPath;
  const filepath = getImagePath(filename, type as "originals" | "thumbnails");

  if (!fs.existsSync(filepath)) throw error(404, "File not found");

  const buffer = fs.readFileSync(filepath);
  return new Response(buffer, {
    headers: {
      "Content-Type": img[0].mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
};