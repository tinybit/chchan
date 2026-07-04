import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { BoardsManager, type BoardItem } from "@/components/BoardsManager";

export default async function BoardsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role !== "root") redirect("/admin/approvals");
  const { error } = await searchParams;
  const t = await getT();

  const { rows } = await db.query(
    `select id, slug, name, name_ru, description, description_ru, archived
     from boards order by position, id`,
  );
  const boards: BoardItem[] = rows.map((b) => ({
    id: String(b.id),
    slug: b.slug,
    name: b.name,
    name_ru: b.name_ru,
    description: b.description,
    description_ru: b.description_ru,
    archived: b.archived,
  }));

  return (
    <>
      {error && <div className="error">{error}</div>}
      <BoardsManager
        boards={boards}
        labels={{
          newBoard: t.admin.newBoard,
          editBoard: t.admin.editBoard,
          slug: t.admin.slug,
          nameEn: t.admin.nameEn,
          nameRu: t.admin.nameRu,
          descEn: t.admin.descEn,
          descRu: t.admin.descRu,
          save: t.admin.save,
          create: t.admin.create,
          edit: t.admin.edit,
          cancel: t.admin.cancel,
          archive: t.admin.archive,
          unarchive: t.admin.unarchive,
          archivedBadge: t.admin.archivedBadge,
          dragHint: t.admin.dragHint,
        }}
      />
    </>
  );
}
