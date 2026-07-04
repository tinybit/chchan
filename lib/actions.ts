"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireAdmin, requireApproved, requireRoot } from "./auth";
import { authorHmac, authorLabel } from "./anon";
import { checkRateLimit } from "./ratelimit";
import { processUpload } from "./images";
import { getT } from "./i18n";

const MAX_BODY = 8000;
const MAX_SUBJECT = 120;

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const MAX_IMAGES = 4;

function realFiles(formData: FormData): File[] {
  return (formData.getAll("image") as File[]).filter((f) => f && f.size > 0);
}

async function attachImages(postId: string, files: File[], errPath: string): Promise<void> {
  if (files.length === 0) return;
  const t = await getT();
  if (files.length > MAX_IMAGES) fail(errPath, t.errors.tooManyImages);
  for (const file of files) {
    let img;
    try {
      img = await processUpload(file);
    } catch {
      fail(errPath, t.errors.image);
    }
    await db.query(
      `insert into images (post_id, storage_key, thumb_key, mime, bytes, width, height)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [postId, img.storageKey, img.thumbKey, img.mime, img.bytes, img.width, img.height],
    );
  }
}

export async function createThread(formData: FormData): Promise<void> {
  const user = await requireApproved();
  const t = await getT();
  const boardSlug = String(formData.get("board") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const files = realFiles(formData);
  const boardPath = `/b/${boardSlug}`;

  if (!subject || subject.length > MAX_SUBJECT) fail(boardPath, t.errors.subjectRequired);
  if (body.length > MAX_BODY) fail(boardPath, t.errors.bodyTooLong);
  // A thread needs a title plus at least one of: text, images.
  if (!body && files.length === 0) fail(boardPath, t.errors.emptyPost);

  const { rows: boards } = await db.query(
    "select id, archived from boards where slug = $1",
    [boardSlug],
  );
  if (boards.length === 0 || (boards[0].archived && user.role !== "root")) {
    fail("/", t.errors.noBoard);
  }
  await checkRateLimit(user.id, "thread").catch(() => fail(boardPath, t.errors.rateLimit));

  const { rows: threads } = await db.query(
    "insert into threads (board_id, subject) values ($1, $2) returning id",
    [boards[0].id, subject],
  );
  const threadId = String(threads[0].id);
  const hmac = authorHmac(user.id, threadId);
  const { rows: posts } = await db.query(
    "insert into posts (thread_id, body, author_label, author_hmac) values ($1, $2, $3, $4) returning id",
    [threadId, body, authorLabel(hmac), hmac],
  );
  await attachImages(String(posts[0].id), files, boardPath);

  revalidatePath(boardPath);
  redirect(`${boardPath}/${threadId}`);
}

export async function createReply(formData: FormData): Promise<void> {
  const user = await requireApproved();
  const t = await getT();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const files = realFiles(formData);

  const { rows: threads } = await db.query(
    `select t.id, t.locked, b.slug, b.archived from threads t join boards b on b.id = t.board_id
     where t.id = $1 and t.deleted_at is null`,
    [threadId],
  );
  if (threads.length === 0 || (threads[0].archived && user.role !== "root")) {
    fail("/", t.errors.noThread);
  }
  const threadPath = `/b/${threads[0].slug}/${threadId}`;

  if (threads[0].locked) fail(threadPath, t.errors.threadLocked);
  if (body.length > MAX_BODY) fail(threadPath, t.errors.bodyTooLong);
  if (!body && files.length === 0) fail(threadPath, t.errors.emptyPost);
  await checkRateLimit(user.id, "post").catch(() => fail(threadPath, t.errors.rateLimit));

  const hmac = authorHmac(user.id, threadId);
  const { rows: posts } = await db.query(
    "insert into posts (thread_id, body, author_label, author_hmac) values ($1, $2, $3, $4) returning id",
    [threadId, body, authorLabel(hmac), hmac],
  );
  await attachImages(String(posts[0].id), files, threadPath);
  await db.query("update threads set bumped_at = now() where id = $1", [threadId]);

  revalidatePath(threadPath);
  redirect(threadPath);
}

export async function acceptRules(): Promise<void> {
  const user = await requireApproved();
  await db.query(
    "update users set rules_accepted_at = now() where id = $1 and rules_accepted_at is null",
    [user.id],
  );
  redirect("/");
}

export async function reportPost(formData: FormData): Promise<void> {
  await requireApproved();
  const postId = String(formData.get("postId") ?? "");
  const reason = String(formData.get("reason") ?? "other");
  const backPath = String(formData.get("backPath") ?? "/");
  await db.query("insert into reports (post_id, reason) values ($1, $2)", [postId, reason]);
  redirect(`${backPath}?notice=${encodeURIComponent((await getT()).notices.reported)}`);
}

// --- Admin actions. Every one is written to mod_actions. ---

async function logMod(
  adminId: string,
  action: string,
  targetKind: "post" | "thread" | "user" | "board" | "content",
  targetId: string,
  note = "",
): Promise<void> {
  await db.query(
    "insert into mod_actions (admin_id, action, target_kind, target_id, note) values ($1, $2, $3, $4, $5)",
    [adminId, action, targetKind, targetId, note],
  );
}

export async function approveUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  await db.query(
    "update users set status = 'approved', approved_at = now() where id = $1 and status = 'pending'",
    [userId],
  );
  await logMod(admin.id, "approve", "user", userId);
  revalidatePath("/admin/approvals");
  redirect("/admin/approvals");
}

/** Admins can ban members; only root can ban admins; nobody bans root. */
export async function banUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin/approvals");
  const { rows } = await db.query("select role from users where id = $1", [userId]);
  if (rows.length === 0) redirect(backPath);
  const targetRole = rows[0].role as string;
  if (targetRole === "root" || (targetRole === "admin" && admin.role !== "root")) {
    fail(backPath, (await getT()).errors.cannotBan);
  }
  await db.query("update users set status = 'banned' where id = $1", [userId]);
  await db.query("delete from sessions where user_id = $1", [userId]);
  await logMod(admin.id, "ban", "user", userId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function unbanUser(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const userId = String(formData.get("userId") ?? "");
  const result = await db.query(
    `update users set status = 'approved', approved_at = coalesce(approved_at, now())
     where id = $1 and status = 'banned'`,
    [userId],
  );
  if ((result.rowCount ?? 0) > 0) {
    await logMod(root.id, "unban", "user", userId);
  }
  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function setAdminRole(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const userId = String(formData.get("userId") ?? "");
  const makeAdmin = String(formData.get("makeAdmin") ?? "") === "1";
  await db.query(
    `update users set role = $1
     where id = $2 and role <> 'root' and status = 'approved'`,
    [makeAdmin ? "admin" : "member", userId],
  );
  await logMod(root.id, makeAdmin ? "promote-admin" : "demote-admin", "user", userId);
  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function hidePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update posts set hidden = not hidden where id = $1", [postId]);
  await logMod(admin.id, "toggle-hide", "post", postId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function deletePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update posts set deleted_at = now() where id = $1", [postId]);
  await logMod(admin.id, "delete", "post", postId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function lockThread(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const threadId = String(formData.get("threadId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin");
  await db.query("update threads set locked = not locked where id = $1", [threadId]);
  await logMod(admin.id, "toggle-lock", "thread", threadId);
  revalidatePath(backPath);
  redirect(backPath);
}

export async function resolveReport(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  await db.query(
    "update reports set resolved_at = now(), resolved_by = $1 where id = $2",
    [admin.id, reportId],
  );
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}

// --- Board management: root only. ---

function boardFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    nameRu: String(formData.get("nameRu") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    descriptionRu: String(formData.get("descriptionRu") ?? "").trim(),
  };
}

/** New boards start archived (hidden from members) at the top of the list. */
export async function createBoard(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const t = await getT();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const f = boardFields(formData);
  if (!/^[a-z0-9]{1,10}$/.test(slug)) fail("/admin/boards", t.errors.badSlug);
  if (!f.name) fail("/admin/boards", t.errors.nameRequired);

  const { rows } = await db.query(
    `insert into boards (slug, name, description, name_ru, description_ru, position, archived)
     values ($1, $2, $3, $4, $5,
             (select coalesce(min(position), 1) - 1 from boards), true)
     on conflict (slug) do nothing
     returning id`,
    [slug, f.name, f.description, f.nameRu, f.descriptionRu],
  );
  if (rows.length === 0) fail("/admin/boards", t.errors.slugTaken);
  await logMod(root.id, "create-board", "board", String(rows[0].id), `/${slug}/`);
  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

export async function updateBoard(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const t = await getT();
  const boardId = String(formData.get("boardId") ?? "");
  const f = boardFields(formData);
  if (!f.name) fail("/admin/boards", t.errors.nameRequired);

  const { rows } = await db.query(
    `update boards set name = $1, description = $2, name_ru = $3, description_ru = $4
     where id = $5 returning slug`,
    [f.name, f.description, f.nameRu, f.descriptionRu, boardId],
  );
  if (rows.length > 0) {
    await logMod(root.id, "update-board", "board", boardId, `/${rows[0].slug}/`);
  }
  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

export async function setBoardArchived(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const boardId = String(formData.get("boardId") ?? "");
  const archived = String(formData.get("archived") ?? "") === "1";
  const { rows } = await db.query(
    "update boards set archived = $1 where id = $2 returning slug",
    [archived, boardId],
  );
  if (rows.length > 0) {
    await logMod(
      root.id,
      archived ? "archive-board" : "unarchive-board",
      "board",
      boardId,
      `/${rows[0].slug}/`,
    );
  }
  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

/** Called from the drag-and-drop list with the full board id order. */
export async function reorderBoards(ids: string[]): Promise<void> {
  await requireRoot();
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) return;
  await db.query(
    `update boards b set position = u.pos
     from (select unnest($1::bigint[]) as id,
                  generate_subscripts($1::bigint[], 1) - 1 as pos) u
     where b.id = u.id`,
    [ids],
  );
  revalidatePath("/admin/boards");
  revalidatePath("/");
}

// --- Editable site content (rules page): root only. ---

const CONTENT_KEYS = new Set(["rules_en", "rules_ru"]);
const MAX_CONTENT_HTML = 200_000;

export async function saveSiteContent(formData: FormData): Promise<void> {
  const root = await requireRoot();
  const key = String(formData.get("key") ?? "");
  const html = String(formData.get("html") ?? "");
  if (!CONTENT_KEYS.has(key) || html.length === 0 || html.length > MAX_CONTENT_HTML) {
    redirect("/admin/rules");
  }
  await db.query(
    `insert into site_content (key, html, updated_at) values ($1, $2, now())
     on conflict (key) do update set html = excluded.html, updated_at = now()`,
    [key, html],
  );
  await logMod(root.id, "update-content", "content", "0", key);
  revalidatePath("/rules");
  revalidatePath("/admin/rules");
  redirect("/admin/rules");
}

/**
 * The one deliberate deanonymization path: recompute the author HMAC against
 * every member to find who wrote a post, then ban them. Always logged.
 */
export async function banAuthorOfPost(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const backPath = String(formData.get("backPath") ?? "/admin/reports");
  const { rows: posts } = await db.query(
    "select thread_id, author_hmac from posts where id = $1",
    [postId],
  );
  if (posts.length === 0) redirect(backPath);
  const { thread_id: threadId, author_hmac: target } = posts[0];

  const t = await getT();
  const { rows: users } = await db.query("select id, role from users where status = 'approved'");
  const match = users.find((u) => authorHmac(String(u.id), String(threadId)) === target);
  if (!match) fail(backPath, t.errors.authorNotFound);
  if (match!.role === "root" || (match!.role === "admin" && admin.role !== "root")) {
    fail(backPath, t.errors.cannotBan);
  }

  await db.query("update users set status = 'banned' where id = $1", [match!.id]);
  await db.query("delete from sessions where user_id = $1", [match!.id]);
  await logMod(admin.id, "ban-author", "post", postId, "author resolved via HMAC scan");
  revalidatePath(backPath);
  redirect(backPath);
}
