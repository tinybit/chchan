-- Password accounts (invite-based) alongside Google accounts. Username and
-- password are login credentials only -- never shown on the board, exactly
-- like email. Anonymity is unchanged: authorship is keyed on user_id.
alter table users add column username text unique;
alter table users add column password_hash text;
alter table users alter column email drop not null;

-- Single-use invite links, generatable by any admin.
create table invites (
  id bigint generated always as identity primary key,
  token text not null unique,
  created_by bigint not null references users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by bigint references users(id)
);
create index invites_active_idx on invites (created_at desc) where used_at is null;

alter table mod_actions drop constraint mod_actions_target_kind_check;
alter table mod_actions add constraint mod_actions_target_kind_check
  check (target_kind in ('post', 'thread', 'user', 'board', 'content', 'invite'));
