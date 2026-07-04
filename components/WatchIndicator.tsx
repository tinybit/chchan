"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWatched } from "@/lib/clientNotify";

type Updated = { threadId: string; title: string; slug: string; href: string; extra: number };

export function WatchIndicator({ label, emptyLabel }: { label: string; emptyLabel: string }) {
  const [updated, setUpdated] = useState<Updated[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const watched = getWatched();
      const ids = Object.keys(watched);
      if (ids.length === 0) {
        if (!cancelled) setUpdated([]);
        return;
      }
      try {
        const res = await fetch(`/api/thread-counts?ids=${ids.join(",")}`);
        if (!res.ok) return;
        const { counts } = (await res.json()) as { counts: Record<string, number> };
        if (cancelled) return;
        const list: Updated[] = [];
        for (const [threadId, entry] of Object.entries(watched)) {
          const live = counts[threadId];
          if (live != null && live > entry.seenCount) {
            list.push({
              threadId,
              title: entry.title,
              slug: entry.slug,
              href: entry.href,
              extra: live - entry.seenCount,
            });
          }
        }
        setUpdated(list);
      } catch {
        // network hiccup: leave the last known state
      }
    }

    poll();
    const timer = setInterval(poll, 30000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (updated.length === 0) return null;
  const total = updated.reduce((n, u) => n + u.extra, 0);

  return (
    <span className="watch-indicator">
      <button type="button" className="watch-bell" onClick={() => setOpen((v) => !v)}>
        {label} {total}
      </button>
      {open && (
        <span className="watch-panel">
          {updated.length === 0 && <span className="muted">{emptyLabel}</span>}
          {updated.map((u) => (
            <Link key={u.threadId} href={u.href} onClick={() => setOpen(false)}>
              /{u.slug}/ {u.title} <b>+{u.extra}</b>
            </Link>
          ))}
        </span>
      )}
    </span>
  );
}
