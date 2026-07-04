-- Boards get Russian name/description alongside the English ones.
alter table boards add column name_ru text not null default '';
alter table boards add column description_ru text not null default '';

-- Tech moves from /g/ to /t/; /g/ becomes Games (seeded by scripts/seed.mjs).
update boards set slug = 't' where slug = 'g' and name = 'Tech';
