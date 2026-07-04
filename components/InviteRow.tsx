"use client";

import { useState } from "react";

export function CopyLink({ url, copyLabel }: { url: string; copyLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="invite-link">
      <code>{url}</code>
      <button
        type="button"
        className="linkish"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "\u2713" : copyLabel}
      </button>
    </span>
  );
}
