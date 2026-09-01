import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { env } from "$env/dynamic/private";

const UPLOADS_DIR = env.UPLOADS_DIR || "uploads";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const THUMBNAIL_SIZE = 400;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function ensureUploadsDir() {
  const base = path.resolve(UPLOADS_DIR);
  fs.mkdirSync(path.join(base, "originals"), { recursive: true });
  fs.mkdirSync(path.join(base, "thumbnails"), { recursive: true });
  return base;
}

export async function saveImage(
  file: File
): Promise<{
  storagePath: string;
  thumbnailPath: string;
  mimeType: string;
  width: number;
  height: number;
}> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const base = ensureUploadsDir();
  const buffer = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  const ext = file.type.split("/")[1] || "jpg";
  const filename = `${id}.${ext}`;

  const metadata = await sharp(buffer).metadata();

  await sharp(buffer)
    .rotate()
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(path.join(base, "originals", filename));

  await sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 75 })
    .toFile(path.join(base, "thumbnails", filename));

  return {
    storagePath: filename,
    thumbnailPath: filename,
    mimeType: "image/jpeg",
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

export function getImagePath(filename: string, type: "originals" | "thumbnails") {
  const base = path.resolve(UPLOADS_DIR);
  return path.join(base, type, filename);
}