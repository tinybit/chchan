"use client";

import { useEffect, useState } from "react";
import {
  addOwnPosts,
  getLastSeen,
  getOwnPosts,
  isWatched,
  markSeen,
  unwatchThread,
  watchThread,
} from "@/lib/clientNotify";

type Props = {
  threadId: string;
  slug: string;
  title: string;
  postIds: string[];
  youLabel: string;
  watchLabel: string;
  unwatchLabel: string;
};

/**
 * Client-only thread enhancements: records this browser's own posts, tags
 * "(You)", highlights posts new since last visit, and the watch toggle.
 * Nothing here touches the server's knowledge of authorship.
 */
export function ThreadClient({
  threadId,
  slug,
  title,
  postIds,
  youLabel,
  watchLabel,
  unwatchLabel,
}: Props) {
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    // 1. If we just posted, record the new post id as ours, then clean the URL.
    const params = new URLSearchParams(window.location.search);
    const posted = params.get("posted");
    if (posted) {
      addOwnPosts([posted]);
      params.delete("posted");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    }

    const own = getOwnPosts();
    const lastSeen = getLastSeen(threadId);

    // 2. Mark own posts and highlight ones new since last visit.
    postIds.forEach((id, index) => {
      const el = document.getElementById(`p${id}`);
      if (!el) return;
      if (own.has(id)) {
        const label = el.querySelector(".post-meta .label");
        if (label && !label.querySelector(".you-tag")) {
          const tag = document.createElement("span");
          tag.className = "you-tag";
          tag.textContent = ` ${youLabel}`;
          label.appendChild(tag);
        }
      }
      if (index + 1 > lastSeen && lastSeen > 0) el.classList.add("post-new");
    });

    // 3. Tag backlinks (>>N) that point to our own posts.
    document.querySelectorAll<HTMLAnchorElement>(".quote-link").forEach((a) => {
      const m = a.getAttribute("href")?.match(/#p(\d+)/);
      if (m && own.has(m[1]) && !a.querySelector(".you-tag")) {
        const tag = document.createElement("span");
        tag.className = "you-tag";
        tag.textContent = ` ${youLabel}`;
        a.appendChild(tag);
      }
    });

    // 4. This visit is now the baseline for "new".
    markSeen(threadId, postIds.length);
    setWatching(isWatched(threadId));
  }, [threadId, postIds, youLabel]);

  function toggleWatch() {
    if (isWatched(threadId)) {
      unwatchThread(threadId);
      setWatching(false);
    } else {
      watchThread(threadId, {
        seenCount: postIds.length,
        slug,
        title,
        href: `/b/${slug}/${threadId}`,
      });
      setWatching(true);
    }
  }

  return (
    <button type="button" className="linkish watch-toggle" onClick={toggleWatch}>
      {watching ? unwatchLabel : watchLabel}
    </button>
  );
}
