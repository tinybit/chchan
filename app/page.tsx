import Link from "next/link";
import { db } from "@/lib/db";
import { guardApproved } from "@/lib/guard";
import { getLang, getT } from "@/lib/i18n";
import { boardName, boardDescription } from "@/lib/boards";
import { Hero } from "@/components/Hero";

export default async function HomePage() {
  await guardApproved();
  const [lang, t] = await Promise.all([getLang(), getT()]);
  const { rows: boards } = await db.query(
    `select b.slug, b.name, b.description, b.name_ru, b.description_ru,
            (select count(*) from threads t where t.board_id = b.id and t.deleted_at is null) as threads
     from boards b where not b.archived order by b.position, b.id`,
  );

  return (
    <main>
      <Hero />
      <div className="home-boards">
        <h1>{t.home.boards}</h1>
        {boards.length === 0 && <p className="muted">{t.home.noBoards}</p>}
        {boards.map((b) => (
          <div className="board-card" key={b.slug}>
            <Link href={`/b/${b.slug}`}>
              /{b.slug}/ - {boardName(b, lang)}
            </Link>
            <div className="muted">
              {boardDescription(b, lang)} ({t.home.threads(Number(b.threads))})
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
