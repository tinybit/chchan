-- Root-editable page content (rules page, per language), stored as HTML
-- produced by the admin WYSIWYG editor. Only root can write it.
create table site_content (
  key text primary key,
  html text not null,
  updated_at timestamptz not null default now()
);

alter table mod_actions drop constraint mod_actions_target_kind_check;
alter table mod_actions add constraint mod_actions_target_kind_check
  check (target_kind in ('post', 'thread', 'user', 'board', 'content'));

insert into site_content (key, html) values
('rules_en', $HTML$<h1>Rules and the honest fine print</h1>
<h2>What this is</h2>
<p>An unofficial anonymous board for ClickHouse folks, run as a pet project. It is not a company system, not endorsed by anyone, and not moderated by HR.</p>
<h2>How anonymity works here</h2>
<ul>
<li><p>Google sign-in is used once, to verify you are @clickhouse.com and approve you.</p></li>
<li><p>Posts are <strong>not</strong> linked to your account. The database stores no author id on posts — only a per-thread anonymous label derived from a keyed hash.</p></li>
<li><p>Admins have no “who wrote this” button and no routine way to find out.</p></li>
<li><p>Uploaded images are re-encoded and all metadata (EXIF, GPS) is stripped.</p></li>
<li><p>No IP addresses or user agents are written to the application database.</p></li>
</ul>
<h2>The honest limits</h2>
<ul>
<li><p>This runs on commercial hosting (Vercel, Neon). Infrastructure providers keep standard request logs outside our control. The threat model protects you from coworkers and from the operator — not from subpoenas or a platform compromise.</p></li>
<li><p>There is exactly one deliberate deanonymization path: if a post is serious abuse, an admin can recompute the hash against the member list to ban the author. Every use of it is permanently logged and visible in the moderation log.</p></li>
<li><p>Writing style is a fingerprint. The site cannot protect you from yourself.</p></li>
</ul>
<h2>Rules</h2>
<ol>
<li><p>No harassment or threats against real people.</p></li>
<li><p>No confidential company data: no customer info, credentials, or unreleased numbers.</p></li>
<li><p>No illegal content. This gets the whole site killed instantly.</p></li>
<li><p>No deanonymization attempts against other posters.</p></li>
<li><p>Shitposting is fine. That is what this place is for.</p></li>
</ol>
<h2>Escalation</h2>
<p>Threats, doxxing, confidential leaks, or illegal content: the post comes down first, questions after. Everything else: report it and the mods will look when they look.</p>$HTML$),
('rules_ru', $HTML$<h1>Правила и честный мелкий шрифт</h1>
<h2>Что это такое</h2>
<p>Неофициальная анонимная борда для своих из ClickHouse, пет-проект. Это не корпоративная система, никем не одобрена и не модерируется HR.</p>
<h2>Как тут работает анонимность</h2>
<ul>
<li><p>Вход через Google нужен один раз — проверить, что ты из @clickhouse.com, и одобрить заявку.</p></li>
<li><p>Посты <strong>не</strong> привязаны к аккаунту. В базе у поста нет автора — только анонимная метка внутри треда, полученная из хэша с ключом.</p></li>
<li><p>У админов нет кнопки «кто это написал» и нет обычного способа это узнать.</p></li>
<li><p>Загруженные картинки перекодируются, все метаданные (EXIF, GPS) вырезаются.</p></li>
<li><p>IP-адреса и user agent'ы в базу приложения не пишутся.</p></li>
</ul>
<h2>Честные ограничения</h2>
<ul>
<li><p>Всё это крутится на коммерческом хостинге (Vercel, Neon). У инфраструктурных провайдеров есть стандартные логи запросов, которые мы не контролируем. Модель угроз защищает от коллег и от оператора — не от повесток и не от взлома платформы.</p></li>
<li><p>Есть ровно один осознанный путь деанона: если пост — серьёзное нарушение, админ может пересчитать хэш по списку участников и забанить автора. Каждое использование навсегда попадает в журнал модерации.</p></li>
<li><p>Стиль письма — это отпечаток. Сайт не защитит тебя от тебя самого.</p></li>
</ul>
<h2>Правила</h2>
<ol>
<li><p>Никакой травли и угроз реальным людям.</p></li>
<li><p>Никаких конфиденциальных данных компании: ни клиентов, ни кредов, ни цифр до релиза.</p></li>
<li><p>Ничего незаконного. Это мгновенно убьёт весь сайт.</p></li>
<li><p>Не пытаться деанонить других постеров.</p></li>
<li><p>Щитпостинг — можно. Для этого всё и затевалось.</p></li>
</ol>
<h2>Эскалация</h2>
<p>Угрозы, доксинг, сливы конфиденциальщины, незаконный контент: сначала пост снимается, вопросы потом. Всё остальное: жалуйся, модеры посмотрят, когда посмотрят.</p>$HTML$);
