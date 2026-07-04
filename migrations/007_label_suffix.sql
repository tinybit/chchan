-- author_label now stores only the hash suffix; the "Anon"/"Анон" prefix is
-- rendered per-language in the UI.
update posts set author_label = substring(author_label from 6)
where author_label like 'Anon %';
