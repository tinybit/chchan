import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { deleteObject, getObject, putObject } from "./storage";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export function isAllowedImageType(type: string): boolean {
  return ALLOWED.has(type);
}

export type ProcessedImage = {
  storageKey: string;
  thumbKey: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
};

/**
 * Re-encodes raw image bytes. This is not an optimization pass: re-encoding is
 * what guarantees EXIF/GPS/XMP metadata cannot survive into the stored file.
 * Works from a buffer so it can process an object uploaded directly to R2.
 */
export async function processImage(input: Buffer, type: string): Promise<ProcessedImage> {
  if (!ALLOWED.has(type)) throw new Error("unsupported image type");
  if (input.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large (max 8 MB)");

  const isGif = type === "image/gif";
  const image = sharp(input, { animated: isGif });
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("unreadable image");

  let full: Buffer;
  let ext: string;
  let mime: string;
  if (isGif) {
    full = await image.gif().toBuffer();
    ext = "gif";
    mime = "image/gif";
  } else if (type === "image/png") {
    // rotate() bakes in EXIF orientation before the metadata is dropped.
    full = await image.rotate().png().toBuffer();
    ext = "png";
    mime = "image/png";
  } else {
    full = await image.rotate().jpeg({ quality: 88 }).toBuffer();
    ext = "jpg";
    mime = "image/jpeg";
  }

  // Larger preview so it stays crisp when shown near full width on phones
  // (and downscales cleanly on desktop). Clicking still opens the full image.
  const thumb = await sharp(input)
    .rotate()
    .resize(900, 900, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const id = randomBytes(16).toString("hex");
  const storageKey = `img/${id}.${ext}`;
  const thumbKey = `thumb/${id}.jpg`;
  await putObject(storageKey, full);
  await putObject(thumbKey, thumb);

  return {
    storageKey,
    thumbKey,
    mime,
    bytes: full.byteLength,
    width: meta.width,
    height: meta.pageHeight ?? meta.height,
  };
}

/**
 * Finalize a browser-uploaded temp object: fetch it, re-encode (stripping
 * metadata), write the final image + thumbnail, then delete the temp object.
 * The temp key is always deleted, even on failure.
 */
export async function processImageFromTemp(
  tempKey: string,
  type: string,
): Promise<ProcessedImage> {
  try {
    const raw = await getObject(tempKey);
    if (!raw) throw new Error("upload not found");
    return await processImage(raw, type);
  } finally {
    await deleteObject(tempKey);
  }
}

/** Temp keys live under upload/ and must be exactly what we handed out. */
export function isTempKey(key: string): boolean {
  return /^upload\/[a-f0-9]{32}$/.test(key);
}

export function newTempKey(): string {
  return `upload/${randomBytes(16).toString("hex")}`;
}
