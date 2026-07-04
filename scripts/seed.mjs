import pg from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://localhost:5432/chchan";
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

// slug, name_en, description_en, name_ru, description_ru, position
const boards = [
  ["b", "Random", "Danger of intellectual defeat.", "Бред", "Опасность интеллектуального поражения", 0],
  ["w", "Work", "Work, teams, decisions, on-call.", "Work", "Работы, тимы, решения, онколл.", 1],
  ["t", "Tech", "Databases, programming, hardware.", "Tech", "Базы данных, программирование, железки.", 2],
  ["g", "Games", "From billiards to Warcraft.", "Games", "От бильярда до Варкрафта.", 3],
];

try {
  for (const [slug, name, description, nameRu, descriptionRu, position] of boards) {
    await client.query(
      `insert into boards (slug, name, description, name_ru, description_ru, position)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (slug) do update set
         name = excluded.name,
         description = excluded.description,
         name_ru = excluded.name_ru,
         description_ru = excluded.description_ru,
         position = excluded.position`,
      [slug, name, description, nameRu, descriptionRu, position],
    );
  }
  const { rows } = await client.query("select slug, name from boards order by position");
  console.log("boards:", rows.map((r) => `/${r.slug}/ ${r.name}`).join(", "));
} finally {
  await client.end();
}
