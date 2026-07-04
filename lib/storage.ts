import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Two backends behind the same two functions: Cloudflare R2 (S3 API) when
// R2_* env vars are set (production), local disk otherwise (development).
// Objects are always served through /files/* so the members-only check holds.

const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");

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

export async function putObject(key: string, data: Buffer): Promise<void> {
  if (r2) {
    await r2.send(
      new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: data }),
    );
    return;
  }
  const target = path.join(uploadsDir, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getObject(key: string): Promise<Buffer | null> {
  if (r2) {
    try {
      const res = await r2.send(
        new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
      );
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch {
      return null;
    }
  }
  const target = path.resolve(uploadsDir, key);
  if (!target.startsWith(uploadsDir + path.sep)) return null;
  try {
    return await readFile(target);
  } catch {
    return null;
  }
}

export function publicUrl(key: string): string {
  return `/files/${key}`;
}
