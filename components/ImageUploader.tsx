"use client";

import { useRef, useState } from "react";

type Item = { name: string; type: string; key: string; status: "uploading" | "done" | "error" };

const MAX_FILES = 4;
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Uploads chosen images straight to storage (presigned R2 PUT, or the local
 * route in dev), then exposes the resulting temp keys as hidden inputs named
 * "imageKey" so the post is submitted without any file bytes passing through
 * the server action (which has a hard ~4.5MB body limit on Vercel).
 */
export function ImageUploader({ label }: { label: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = items.some((i) => i.status === "uploading");

  async function onPick(files: FileList | null) {
    if (!files) return;
    setError(null);
    const chosen = Array.from(files).slice(0, MAX_FILES - items.length);

    for (const file of chosen) {
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: too large (max 8 MB)`);
        continue;
      }
      const item: Item = { name: file.name, type: file.type, key: "", status: "uploading" };
      setItems((prev) => [...prev, item]);
      try {
        const signRes = await fetch("/api/upload/sign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        });
        if (!signRes.ok) throw new Error((await signRes.json()).error ?? "sign failed");
        const { key, url } = (await signRes.json()) as { key: string; url: string };

        const putRes = await fetch(url, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error("upload failed");

        setItems((prev) =>
          prev.map((i) => (i === item ? { ...i, key, status: "done" } : i)),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "upload failed");
        setItems((prev) => prev.map((i) => (i === item ? { ...i, status: "error" } : i)));
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="uploader">
      <label>{label}</label>
      {items.map((i, idx) => (
        <div key={idx} className="uploader-item">
          {i.status === "done" && <input type="hidden" name="imageKey" value={i.key} />}
          {i.status === "done" && <input type="hidden" name="imageType" value={i.type} />}
          <span className="uploader-name">{i.name}</span>
          <span className="muted">
            {i.status === "uploading" ? "…" : i.status === "error" ? "✗" : "✓"}
          </span>
          {i.status !== "uploading" && (
            <button type="button" className="linkish" onClick={() => remove(idx)}>
              ✕
            </button>
          )}
        </div>
      ))}
      {items.length < MAX_FILES && (
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => onPick(e.target.files)}
        />
      )}
      {error && <div className="error">{error}</div>}
      {busy && <input type="hidden" name="uploadBusy" value="1" />}
    </div>
  );
}
