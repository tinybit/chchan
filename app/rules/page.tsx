import { guardMember } from "@/lib/guard";
import { acceptRules } from "@/lib/actions";
import { getLang, getT } from "@/lib/i18n";

function RulesEn() {
  return (
    <>
      <h1>Rules and the honest fine print</h1>

      <h2>What this is</h2>
      <p>
        An unofficial anonymous board for ClickHouse folks, run as a pet project. It is not a
        company system, not endorsed by anyone, and not moderated by HR.
      </p>

      <h2>How anonymity works here</h2>
      <ul>
        <li>Google sign-in is used once, to verify you are @clickhouse.com and approve you.</li>
        <li>
          Posts are <b>not</b> linked to your account. The database stores no author id on posts
          &mdash; only a per-thread anonymous label derived from a keyed hash.
        </li>
        <li>Admins have no &ldquo;who wrote this&rdquo; button and no routine way to find out.</li>
        <li>Uploaded images are re-encoded and all metadata (EXIF, GPS) is stripped.</li>
        <li>No IP addresses or user agents are written to the application database.</li>
      </ul>

      <h2>The honest limits</h2>
      <ul>
        <li>
          This runs on commercial hosting (Vercel, Neon). Infrastructure providers keep standard
          request logs outside our control. The threat model protects you from coworkers and from
          the operator &mdash; not from subpoenas or a platform compromise.
        </li>
        <li>
          There is exactly one deliberate deanonymization path: if a post is serious abuse, an
          admin can recompute the hash against the member list to ban the author. Every use of it
          is permanently logged and visible in the moderation log.
        </li>
        <li>Writing style is a fingerprint. The site cannot protect you from yourself.</li>
      </ul>

      <h2>Rules</h2>
      <ol>
        <li>No harassment or threats against real people.</li>
        <li>No confidential company data: no customer info, credentials, or unreleased numbers.</li>
        <li>No illegal content. This gets the whole site killed instantly.</li>
        <li>No deanonymization attempts against other posters.</li>
        <li>Shitposting is fine. That is what this place is for.</li>
      </ol>

      <h2>Escalation</h2>
      <p>
        Threats, doxxing, confidential leaks, or illegal content: the post comes down first,
        questions after. Everything else: report it and the mods will look when they look.
      </p>
    </>
  );
}

function RulesRu() {
  return (
    <>
      <h1>Правила и честный мелкий шрифт</h1>

      <h2>Что это такое</h2>
      <p>
        Неофициальная анонимная борда для своих из ClickHouse, пет-проект. Это не корпоративная
        система, никем не одобрена и не модерируется HR.
      </p>

      <h2>Как тут работает анонимность</h2>
      <ul>
        <li>
          Вход через Google нужен один раз &mdash; проверить, что ты из @clickhouse.com, и
          одобрить заявку.
        </li>
        <li>
          Посты <b>не</b> привязаны к аккаунту. В базе у поста нет автора &mdash; только
          анонимная метка внутри треда, полученная из хэша с ключом.
        </li>
        <li>
          У админов нет кнопки &laquo;кто это написал&raquo; и нет обычного способа это узнать.
        </li>
        <li>Загруженные картинки перекодируются, все метаданные (EXIF, GPS) вырезаются.</li>
        <li>IP-адреса и user agent&apos;ы в базу приложения не пишутся.</li>
      </ul>

      <h2>Честные ограничения</h2>
      <ul>
        <li>
          Всё это крутится на коммерческом хостинге (Vercel, Neon). У инфраструктурных
          провайдеров есть стандартные логи запросов, которые мы не контролируем. Модель угроз
          защищает от коллег и от оператора &mdash; не от повесток и не от взлома платформы.
        </li>
        <li>
          Есть ровно один осознанный путь деанона: если пост &mdash; серьёзное нарушение, админ
          может пересчитать хэш по списку участников и забанить автора. Каждое использование
          навсегда попадает в журнал модерации.
        </li>
        <li>Стиль письма &mdash; это отпечаток. Сайт не защитит тебя от тебя самого.</li>
      </ul>

      <h2>Правила</h2>
      <ol>
        <li>Никакой травли и угроз реальным людям.</li>
        <li>
          Никаких конфиденциальных данных компании: ни клиентов, ни кредов, ни цифр до релиза.
        </li>
        <li>Ничего незаконного. Это мгновенно убьёт весь сайт.</li>
        <li>Не пытаться деанонить других постеров.</li>
        <li>Щитпостинг &mdash; можно. Для этого всё и затевалось.</li>
      </ol>

      <h2>Эскалация</h2>
      <p>
        Угрозы, доксинг, сливы конфиденциальщины, незаконный контент: сначала пост снимается,
        вопросы потом. Всё остальное: жалуйся, модеры посмотрят, когда посмотрят.
      </p>
    </>
  );
}

export default async function RulesPage() {
  const user = await guardMember();
  const [lang, t] = await Promise.all([getLang(), getT()]);

  return (
    <main style={{ maxWidth: 720 }}>
      {lang === "ru" ? <RulesRu /> : <RulesEn />}
      {!user.rulesAccepted && (
        <form action={acceptRules}>
          <button type="submit">{t.rulesPage.accept}</button>
        </form>
      )}
    </main>
  );
}
