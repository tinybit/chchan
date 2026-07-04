import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://localhost:5432/chchan";
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const boards = [
  ["b", "Random", "Anything goes. The main board.", 0],
  ["w", "Work", "Projects, teams, decisions, on-call pain.", 1],
  ["g", "Tech", "Databases, code, hot takes about programming.", 2],
];

try {
  for (const [slug, name, description, position] of boards) {
    await client.query(
      `insert into boards (slug, name, description, position)
       values ($1, $2, $3, $4) on conflict (slug) do nothing`,
      [slug, name, description, position],
    );
  }
  const { rows } = await client.query("select slug, name from boards order by position");
  console.log("boards:", rows.map((r) => `/${r.slug}/ ${r.name}`).join(", "));
} finally {
  await client.end();
}
