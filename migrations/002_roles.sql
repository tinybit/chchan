-- Role hierarchy: root (site owner, from ROOT_EMAIL env) > admin > member.
alter table users add column role text not null default 'member'
  check (role in ('member', 'admin', 'root'));

update users set role = 'admin' where is_admin;

alter table users drop column is_admin;
