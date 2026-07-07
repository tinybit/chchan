import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { putObject } from "./storage";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export type ProcessedImage = {
  storageKey: string;
  thumbKey: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
};

/**
 * Re-encodes every upload. This is not an optimization pass: re-encoding is
 * what guarantees EXIF/GPS/XMP metadata cannot survive into the stored file.
 */
export async function processUpload(file: File): Promise<ProcessedImage> {
  if (!ALLOWED.has(file.type)) throw new Error("unsupported image type");
  if (file.size > MAX_BYTES) throw new Error("image too large (max 8 MB)");

  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";
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
  } else if (file.type === "image/png") {
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
