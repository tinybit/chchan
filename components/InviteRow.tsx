"use client";

import { useState } from "react";

export function DownloadInvites({ links, label }: { links: string[]; label: string }) {
  function download() {
    const blob = new Blob([links.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chchan-invites-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={download}>
      {label} ({links.length})
    </button>
  );
}

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
