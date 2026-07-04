-- Archived boards are invisible to members (root still sees them in admin
-- and can view/post to prepare content before unarchiving).
alter table boards add column archived boolean not null default false;
