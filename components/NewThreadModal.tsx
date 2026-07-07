"use client";

import { useEffect, useState } from "react";
import { createThread } from "@/lib/actions";
import { SubmitButton } from "./SubmitButton";
import { ImageUploader } from "./ImageUploader";

export type NewThreadLabels = {
  create: string;
  newThread: string;
  subject: string;
  comment: string;
  image: string;
  post: string;
  cancel: string;
};

export function NewThreadModal({ slug, labels }: { slug: string; labels: NewThreadLabels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="btn-create" onClick={() => setOpen(true)}>
        + {labels.create}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{labels.newThread}</h3>
            <form className="modal-form" action={createThread}>
              <input type="hidden" name="board" value={slug} />
              <label>
                <span className="muted">{labels.subject}</span>
                <input name="subject" type="text" maxLength={120} required autoFocus />
              </label>
              <label>
                <span className="muted">{labels.comment}</span>
                <textarea name="body" maxLength={8000} />
              </label>
              <ImageUploader label={labels.image} />
              <div className="modal-actions">
                <button type="button" onClick={() => setOpen(false)}>
                  {labels.cancel}
                </button>
                <SubmitButton>{labels.post}</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
