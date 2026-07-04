-- Core rule: posts must never carry a direct user reference.
-- Author identity is reduced to author_hmac = HMAC(ANON_SECRET, user_id:thread_id),
-- so linking a post to an account requires the secret plus a deliberate
-- recomputation over the member list -- never a casual JOIN.

create table users (
  id bigint generated always as identity primary key,
  google_sub text unique,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'banned')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table sessions (
  token_hash text primary key,
  user_id bigint not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sessions_user_idx on sessions (user_id);

create table boards (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  position int not null default 0
);

create table threads (
  id bigint generated always as identity primary key,
  board_id bigint not null references boards(id),
  subject text not null,
  created_at timestamptz not null default now(),
  bumped_at timestamptz not null default now(),
  locked boolean not null default false,
  deleted_at timestamptz
);
create index threads_board_bump_idx on threads (board_id, bumped_at desc) where deleted_at is null;

create table posts (
  id bigint generated always as identity primary key,
  thread_id bigint not null references threads(id),
  body text not null,
  author_label text not null,
  author_hmac text not null,
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  deleted_at timestamptz
);
create index posts_thread_idx on posts (thread_id, id);

create table images (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade,
  storage_key text not null,
  thumb_key text not null,
  mime text not null,
  bytes int not null,
  width int not null,
  height int not null
);
create index images_post_idx on images (post_id);

create table reports (
  id bigint generated always as identity primary key,
  post_id bigint not null references posts(id) on delete cascade,
  reason text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by bigint references users(id)
);
create index reports_open_idx on reports (created_at) where resolved_at is null;

create table mod_actions (
  id bigint generated always as identity primary key,
  admin_id bigint not null references users(id),
  action text not null,
  target_kind text not null check (target_kind in ('post', 'thread', 'user')),
  target_id bigint not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- Hour-granularity buckets on purpose: precise per-post timestamps keyed by
-- user_id would let a DB reader correlate posting times with identities.
create table rate_counters (
  user_id bigint not null references users(id) on delete cascade,
  action text not null,
  bucket timestamptz not null,
  count int not null default 0,
  primary key (user_id, action, bucket)
);
