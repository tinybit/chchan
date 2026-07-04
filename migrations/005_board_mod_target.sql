-- Board management actions are logged too.
alter table mod_actions drop constraint mod_actions_target_kind_check;
alter table mod_actions add constraint mod_actions_target_kind_check
  check (target_kind in ('post', 'thread', 'user', 'board'));
