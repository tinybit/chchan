"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBoard,
  reorderBoards,
  setBoardArchived,
  updateBoard,
} from "@/lib/actions";

export type BoardItem = {
  id: string;
  slug: string;
  name: string;
  name_ru: string;
  description: string;
  description_ru: string;
  archived: boolean;
};

export type BoardsLabels = {
  newBoard: string;
  editBoard: string;
  slug: string;
  nameEn: string;
  nameRu: string;
  descEn: string;
  descRu: string;
  save: string;
  create: string;
  edit: string;
  cancel: string;
  archive: string;
  unarchive: string;
  archivedBadge: string;
  dragHint: string;
};

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Fields({ labels, board }: { labels: BoardsLabels; board?: BoardItem }) {
  return (
    <>
      <label>
        <span className="muted">{labels.nameEn}</span>
        <input name="name" type="text" defaultValue={board?.name ?? ""} required />
      </label>
      <label>
        <span className="muted">{labels.nameRu}</span>
        <input name="nameRu" type="text" defaultValue={board?.name_ru ?? ""} />
      </label>
      <label>
        <span className="muted">{labels.descEn}</span>
        <input name="description" type="text" defaultValue={board?.description ?? ""} />
      </label>
      <label>
        <span className="muted">{labels.descRu}</span>
        <input name="descriptionRu" type="text" defaultValue={board?.description_ru ?? ""} />
      </label>
    </>
  );
}

export function BoardsManager({
  boards,
  labels,
}: {
  boards: BoardItem[];
  labels: BoardsLabels;
}) {
  const [items, setItems] = useState(boards);
  const [editing, setEditing] = useState<BoardItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => setItems(boards), [boards]);

  function handleDrop(target: number) {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDragIndex(null);
    setOverIndex(null);
    startTransition(async () => {
      await reorderBoards(next.map((b) => b.id));
      router.refresh();
    });
  }

  return (
    <>
      <p className="muted">{labels.dragHint}</p>
      <div className="board-list">
        {items.map((b, i) => (
          <div
            key={b.id}
            className={`board-row${dragIndex === i ? " dragging" : ""}${
              overIndex === i && dragIndex !== null && dragIndex !== i ? " drag-over" : ""
            }`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDrop={() => handleDrop(i)}
          >
            <span className="drag-handle" aria-hidden>
              ⠿
            </span>
            <span className="board-slug">/{b.slug}/</span>
            <span className="board-names">
              <b>{b.name}</b>
              {b.name_ru && b.name_ru !== b.name ? ` · ${b.name_ru}` : ""}
              <span className="muted"> — {b.description}</span>
            </span>
            {b.archived && <span className="badge">{labels.archivedBadge}</span>}
            <span className="row-spacer" />
            <button type="button" onClick={() => setEditing(b)}>
              {labels.edit}
            </button>
            <form action={setBoardArchived} style={{ display: "inline" }}>
              <input type="hidden" name="boardId" value={b.id} />
              <input type="hidden" name="archived" value={b.archived ? "0" : "1"} />
              <button type="submit">{b.archived ? labels.unarchive : labels.archive}</button>
            </form>
          </div>
        ))}
      </div>

      <p>
        <button type="button" onClick={() => setCreating(true)}>
          {labels.newBoard}
        </button>
      </p>

      {editing && (
        <Modal title={`${labels.editBoard}: /${editing.slug}/`} onClose={() => setEditing(null)}>
          <form className="modal-form" action={updateBoard}>
            <input type="hidden" name="boardId" value={editing.id} />
            <Fields labels={labels} board={editing} />
            <div className="modal-actions">
              <button type="button" onClick={() => setEditing(null)}>
                {labels.cancel}
              </button>
              <button type="submit">{labels.save}</button>
            </div>
          </form>
        </Modal>
      )}

      {creating && (
        <Modal title={labels.newBoard} onClose={() => setCreating(false)}>
          <form className="modal-form" action={createBoard}>
            <label>
              <span className="muted">{labels.slug}</span>
              <input name="slug" type="text" maxLength={10} pattern="[a-z0-9]{1,10}" required />
            </label>
            <Fields labels={labels} />
            <div className="modal-actions">
              <button type="button" onClick={() => setCreating(false)}>
                {labels.cancel}
              </button>
              <button type="submit">{labels.create}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
