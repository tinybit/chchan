import Link from "next/link";
import { db } from "@/lib/db";
import { guardApproved } from "@/lib/guard";

export default async function HomePage() {
  await guardApproved();
  const { rows: boards } = await db.query(
    `select b.slug, b.name, b.description,
            (select count(*) from threads t where t.board_id = b.id and t.deleted_at is null) as threads
     from boards b order by b.position, b.id`,
  );

  return (
    <main>
      <h1>Boards</h1>
      {boards.length === 0 && <p className="muted">No boards yet. Ask the admin to seed some.</p>}
      {boards.map((b) => (
        <div className="board-card" key={b.slug}>
          <Link href={`/b/${b.slug}`}>
            /{b.slug}/ - {b.name}
          </Link>
          <div className="muted">
            {b.description} ({b.threads} threads)
          </div>
        </div>
      ))}
    </main>
  );
}
