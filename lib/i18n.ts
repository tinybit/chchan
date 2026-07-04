import { cookies } from "next/headers";

export type Lang = "ru" | "en";

function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`;
  return `${n} ${many}`;
}

const en = {
  siteName: "ChChan",
  tagline: "Welcome back. Again.",
  nav: { rules: "rules", admin: "admin", logout: "logout" },
  login: {
    signIn: "Sign in with Google",
    devLogin: "dev login (local only)",
    errors: {
      oauth: "Sign-in failed. Try again.",
      domain: "This Google account cannot sign in here.",
      banned: "Access denied.",
      generic: "Error.",
    } as Record<string, string>,
  },
  pending: {
    title: "Application received",
    before: "Your application (",
    after: ") is pending manual approval.",
  },
  home: {
    boards: "Boards",
    noBoards: "No boards yet. Ask the admin to seed some.",
    threads: (n: number) => (n === 1 ? "1 thread" : `${n} threads`),
  },
  board: {
    newThread: "New thread",
    subject: "Subject",
    comment: "Comment",
    image: "Image (optional, max 8 MB)",
    postThread: "Post thread",
    noThreads: "No threads yet. Start one.",
    replies: (n: number) => (n === 1 ? "1 reply" : `${n} replies`),
    locked: " [locked]",
  },
  thread: {
    backTo: (slug: string) => `\u00ab back to /${slug}/`,
    lock: "lock thread",
    unlock: "unlock thread",
    reply: "Reply",
    postReply: "Post reply",
  },
  post: {
    report: "report",
    hide: "hide",
    unhide: "unhide",
    del: "delete",
    banAuthor: "ban author",
    hiddenTag: " [hidden]",
    hiddenByMods: "[post hidden by moderators]",
  },
  rulesPage: {
    accept: "I have read the rules, let me in",
  },
  admin: {
    title: "Admin",
    pendingApprovals: "Pending approvals",
    queueEmpty: "Queue is empty.",
    email: "Email",
    requested: "Requested",
    actions: "Actions",
    approve: "approve",
    reject: "reject",
    openReports: "Open reports",
    nothingReported: "Nothing reported.",
    reportedOn: "reported",
    postNo: "post No.",
    members: "Members",
    role: "Role",
    status: "Status",
    makeAdmin: "make admin",
    demote: "demote to member",
    ban: "ban",
    unban: "unban",
    resolve: "resolve",
    modLog: "Recent moderation actions",
    when: "When",
    admin: "Admin",
    action: "Action",
    target: "Target",
    note: "Note",
    boardsSection: "Boards",
    newBoard: "New board",
    slug: "slug",
    nameEn: "Name (EN)",
    nameRu: "Name (RU)",
    descEn: "Description (EN)",
    descRu: "Description (RU)",
    save: "save",
    create: "create",
    edit: "edit",
    cancel: "cancel",
    archive: "archive",
    unarchive: "unarchive",
    archivedBadge: "archived",
    editBoard: "Edit board",
    dragHint: "Drag boards to reorder. Archived boards are invisible to members.",
  },
  errors: {
    badSlug: "slug must be 1-10 lowercase letters or digits",
    slugTaken: "a board with this slug already exists",
    nameRequired: "board name (EN) is required",
    subjectRequired: "subject required (max 120 chars)",
    bodyRequired: "body required (max 8000 chars)",
    noBoard: "no such board",
    noThread: "no such thread",
    threadLocked: "thread is locked",
    rateLimit: "slow down: posting limit reached, try again in an hour",
    image: "image rejected: bad type, too large (max 8 MB), or unreadable",
    cannotBan: "you cannot ban this user",
    authorNotFound: "author not found among members",
  },
  notices: {
    reported: "report submitted",
  },
};

export type Dict = typeof en;

const ru: Dict = {
  siteName: "ЧиЧан",
  tagline: "Добро пожаловать. Снова.",
  nav: { rules: "правила", admin: "админка", logout: "выйти" },
  login: {
    signIn: "Войти через Google",
    devLogin: "dev-вход (только локально)",
    errors: {
      oauth: "Не получилось войти. Попробуй ещё раз.",
      domain: "Этому Google-аккаунту сюда нельзя.",
      banned: "Доступ запрещён.",
      generic: "Ошибка.",
    },
  },
  pending: {
    title: "Заявка принята",
    before: "Твоя заявка (",
    after: ") ждёт ручного одобрения.",
  },
  home: {
    boards: "Доски",
    noBoards: "Досок пока нет.",
    threads: (n: number) => ruPlural(n, "тред", "треда", "тредов"),
  },
  board: {
    newThread: "Новый тред",
    subject: "Тема",
    comment: "Комментарий",
    image: "Картинка (необязательно, до 8 МБ)",
    postThread: "Запостить тред",
    noThreads: "Тредов пока нет. Создай первый.",
    replies: (n: number) => ruPlural(n, "ответ", "ответа", "ответов"),
    locked: " [закрыт]",
  },
  thread: {
    backTo: (slug: string) => `\u00ab назад в /${slug}/`,
    lock: "закрыть тред",
    unlock: "открыть тред",
    reply: "Ответить",
    postReply: "Отправить",
  },
  post: {
    report: "жалоба",
    hide: "скрыть",
    unhide: "показать",
    del: "удалить",
    banAuthor: "бан автора",
    hiddenTag: " [скрыт]",
    hiddenByMods: "[пост скрыт модераторами]",
  },
  rulesPage: {
    accept: "Правила прочитал, впускайте",
  },
  admin: {
    title: "Админка",
    pendingApprovals: "Ждут одобрения",
    queueEmpty: "Очередь пуста.",
    email: "Почта",
    requested: "Когда",
    actions: "Действия",
    approve: "одобрить",
    reject: "отклонить",
    openReports: "Открытые жалобы",
    nothingReported: "Жалоб нет.",
    reportedOn: "жалоба от",
    postNo: "пост №",
    members: "Участники",
    role: "Роль",
    status: "Статус",
    makeAdmin: "сделать админом",
    demote: "разжаловать",
    ban: "бан",
    unban: "разбан",
    resolve: "закрыть",
    modLog: "Журнал модерации",
    when: "Когда",
    admin: "Админ",
    action: "Действие",
    target: "Цель",
    note: "Заметка",
    boardsSection: "Доски",
    newBoard: "Новая доска",
    slug: "слаг",
    nameEn: "Название (EN)",
    nameRu: "Название (RU)",
    descEn: "Описание (EN)",
    descRu: "Описание (RU)",
    save: "сохранить",
    create: "создать",
    edit: "править",
    cancel: "отмена",
    archive: "в архив",
    unarchive: "из архива",
    archivedBadge: "архив",
    editBoard: "Править доску",
    dragHint: "Перетаскивай доски, чтобы менять порядок. Архивные доски не видны участникам.",
  },
  errors: {
    badSlug: "слаг: 1-10 строчных латинских букв или цифр",
    slugTaken: "доска с таким слагом уже есть",
    nameRequired: "нужно название (EN)",
    subjectRequired: "нужна тема (до 120 символов)",
    bodyRequired: "нужен текст (до 8000 символов)",
    noBoard: "нет такой доски",
    noThread: "нет такого треда",
    threadLocked: "тред закрыт",
    rateLimit: "не так быстро: лимит постов исчерпан, попробуй через час",
    image: "картинка не подходит: тип, размер (до 8 МБ) или битый файл",
    cannotBan: "этого пользователя нельзя забанить",
    authorNotFound: "автор не найден среди участников",
  },
  notices: {
    reported: "жалоба отправлена",
  },
};

const dicts: Record<Lang, Dict> = { en, ru };

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get("lang")?.value;
  return value === "en" ? "en" : "ru";
}

export async function getT(): Promise<Dict> {
  return dicts[await getLang()];
}
