import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Two backends behind one interface: Cloudflare R2 (S3 API) when R2_* env
// vars are set (production), local disk otherwise (development). Large uploads
// go browser -> R2 directly via a presigned URL (bypassing Vercel's 4.5MB
// function body limit); the server then reads, strips metadata, and finalizes.

const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");
const bucket = process.env.R2_BUCKET;

const r2 =
  process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

export const usingR2 = r2 !== null;

function localPath(key: string): string | null {
  const target = path.resolve(uploadsDir, key);
  return target.startsWith(uploadsDir + path.sep) ? target : null;
}

export async function putObject(key: string, data: Buffer): Promise<void> {
  if (r2) {
    await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data }));
    return;
  }
  const target = localPath(key);
  if (!target) throw new Error("bad key");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (r2) {
    try {
      const res = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch {
      return null;
    }
  }
  const target = localPath(key);
  if (!target) return null;
  try {
    return await readFile(target);
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  if (r2) {
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
    return;
  }
  const target = localPath(key);
  if (target) await unlink(target).catch(() => {});
}

/**
 * Where the browser should upload a temp object. On R2 this is a presigned
 * PUT straight to the bucket; locally it's our own PUT route to disk.
 */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  if (r2) {
    return getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
  }
  return `/api/upload/local?key=${encodeURIComponent(key)}`;
}

export function publicUrl(key: string): string {
  return `/files/${key}`;
}
