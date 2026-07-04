"use client";

import { useEffect, useState } from "react";

export function PostImage({ thumbSrc, fullSrc }: { thumbSrc: string; fullSrc: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="img-zoom" onClick={() => setOpen(true)}>
        <img src={thumbSrc} alt="" />
      </button>
      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <img src={fullSrc} alt="" />
        </div>
      )}
    </>
  );
}
