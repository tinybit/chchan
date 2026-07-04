"use client";

// All notification state lives in the reader's browser, never on the server.
// This is what keeps notifications compatible with the anonymity model:
// the server never learns whose posts are whose or who watches what.

const OWN_POSTS = "chchan_own_posts";
const WATCHED = "chchan_watched";
const LAST_SEEN = "chchan_lastseen";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or disabled: notifications simply degrade to off
  }
}

// --- Own posts (for "(You)" tagging) ---

export function getOwnPosts(): Set<string> {
  return new Set(read<string[]>(OWN_POSTS, []));
}

export function addOwnPosts(ids: string[]): void {
  const set = getOwnPosts();
  for (const id of ids) set.add(id);
  // Cap so the list can't grow without bound.
  const trimmed = [...set].slice(-2000);
  write(OWN_POSTS, trimmed);
}

// --- Watched threads ---

export type WatchEntry = { seenCount: number; slug: string; title: string; href: string };
export type WatchMap = Record<string, WatchEntry>;

export function getWatched(): WatchMap {
  return read<WatchMap>(WATCHED, {});
}

export function isWatched(threadId: string): boolean {
  return threadId in getWatched();
}

export function watchThread(threadId: string, entry: WatchEntry): void {
  const w = getWatched();
  w[threadId] = entry;
  write(WATCHED, w);
}

export function unwatchThread(threadId: string): void {
  const w = getWatched();
  delete w[threadId];
  write(WATCHED, w);
}

// --- Last-seen post count per thread (for "new since last visit") ---

export function getLastSeen(threadId: string): number {
  return read<Record<string, number>>(LAST_SEEN, {})[threadId] ?? 0;
}

/** Records the current post count as seen, and syncs the watch entry if present. */
export function markSeen(threadId: string, count: number): void {
  const all = read<Record<string, number>>(LAST_SEEN, {});
  all[threadId] = count;
  write(LAST_SEEN, all);
  const w = getWatched();
  if (w[threadId]) {
    w[threadId] = { ...w[threadId], seenCount: count };
    write(WATCHED, w);
  }
}
