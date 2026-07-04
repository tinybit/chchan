import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk backend for development. Production swaps this file's two
// functions for R2 (S3 API) without touching callers.

const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "./uploads");

export async function putObject(key: string, data: Buffer): Promise<void> {
  const target = path.join(uploadsDir, key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export function publicUrl(key: string): string {
  return `/files/${key}`;
}

export function uploadsRoot(): string {
  return uploadsDir;
}
