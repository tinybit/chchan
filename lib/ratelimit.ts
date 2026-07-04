import { db } from "./db";

const LIMITS: Record<string, number> = {
  post: 30,
  thread: 5,
};

/**
 * Hour-bucket counters (see migration note): coarse on purpose so the table
 * never becomes a precise user-activity timeline. Old buckets are deleted
 * opportunistically so no historical activity record accumulates either.
 */
export async function checkRateLimit(userId: string, action: "post" | "thread"): Promise<void> {
  await db.query("delete from rate_counters where bucket < now() - interval '2 hours'");
  const { rows } = await db.query(
    `insert into rate_counters (user_id, action, bucket, count)
     values ($1, $2, date_trunc('hour', now()), 1)
     on conflict (user_id, action, bucket) do update
       set count = rate_counters.count + 1
     returning count`,
    [userId, action],
  );
  if (rows[0].count > LIMITS[action]) {
    throw new Error(`rate limit exceeded: max ${LIMITS[action]} ${action}s per hour`);
  }
}
