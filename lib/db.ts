import { Pool } from "pg";

// Reuse the pool across Next.js dev hot-reloads and warm serverless invocations.
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const db =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://localhost:5432/chchan",
    max: 5,
  });

globalForPg.pgPool = db;
