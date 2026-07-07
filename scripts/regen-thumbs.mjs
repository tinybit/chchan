// Regenerate all image thumbnails at the current resolution. Works against
// R2 (when R2_* env vars are set) or the local uploads dir otherwise.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://localhost:5432/chchan";
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

async function get(key) {
  if (r2) {
    const res = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return Buffer.from(await res.Body.transformToByteArray());
  }
  return readFile(path.join(uploadsDir, key));
}

async function put(key, data) {
  if (r2) {
    await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: data }));
    return;
  }
  const target = path.join(uploadsDir, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const { rows } = await client.query("select storage_key, thumb_key from images");
  console.log(`regenerating ${rows.length} thumbnails (${r2 ? "R2" : "local disk"})`);
  for (const { storage_key, thumb_key } of rows) {
    const src = await get(storage_key);
    const thumb = await sharp(src)
      .rotate()
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    await put(thumb_key, thumb);
    console.log(`  ${thumb_key} -> ${thumb.length} bytes`);
  }
  console.log("done");
} finally {
  await client.end();
}
