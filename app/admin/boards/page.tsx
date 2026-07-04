import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getT, type Dict } from "@/lib/i18n";
import { createBoard, updateBoard } from "@/lib/actions";

function BoardFields({
  t,
  board,
}: {
  t: Dict;
  board?: {
    name: string;
    name_ru: string;
    description: string;
    description_ru: string;
    position: number;
  };
}) {
  return (
    <>
      <label>
        <span className="muted">{t.admin.nameEn}</span>
        <input name="name" type="text" defaultValue={board?.name ?? ""} required />
      </label>
      <label>
        <span className="muted">{t.admin.nameRu}</span>
        <input name="nameRu" type="text" defaultValue={board?.name_ru ?? ""} />
      </label>
      <label>
        <span className="muted">{t.admin.descEn}</span>
        <input name="description" type="text" defaultValue={board?.description ?? ""} />
      </label>
      <label>
        <span className="muted">{t.admin.descRu}</span>
        <input name="descriptionRu" type="text" defaultValue={board?.description_ru ?? ""} />
      </label>
      <label className="narrow">
        <span className="muted">{t.admin.position}</span>
        <input name="position" type="number" defaultValue={board?.position ?? 0} />
      </label>
    </>
  );
}

export default async function BoardsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "root") redirect("/admin/approvals");
  const { error } = await searchParams;
  const t = await getT();

  const { rows: boards } = await db.query(
    `select id, slug, name, name_ru, description, description_ru, position
     from boards order by position, id`,
  );

  return (
    <>
      {error && <div className="error">{error}</div>}
      {boards.map((b) => (
        <form className="board-edit" action={updateBoard} key={b.id}>
          <input type="hidden" name="boardId" value={b.id} />
          <span className="board-slug">/{b.slug}/</span>
          <BoardFields t={t} board={b} />
          <button type="submit">{t.admin.save}</button>
        </form>
      ))}
      <h3>{t.admin.newBoard}</h3>
      <form className="board-edit" action={createBoard}>
        <label className="narrow">
          <span className="muted">{t.admin.slug}</span>
          <input name="slug" type="text" maxLength={10} pattern="[a-z0-9]{1,10}" required />
        </label>
        <BoardFields t={t} />
        <button type="submit">{t.admin.create}</button>
      </form>
    </>
  );
}
