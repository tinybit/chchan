import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n";
import { createInvites, revokeInvite } from "@/lib/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { CopyLink, DownloadInvites } from "@/components/InviteRow";

export default async function InvitesPage() {
  const user = await getSessionUser();
  if (!user?.isAdmin) redirect("/");
  const t = await getT();
  const appUrl = process.env.APP_URL ?? "";

  // Active (unused, unexpired) invites first, then the rest.
  const { rows: invites } = await db.query(
    `select id, token, created_at, expires_at, used_at, used_by
     from invites
     order by (used_at is null and expires_at > now()) desc, created_at desc
     limit 200`,
  );

  function status(inv: (typeof invites)[number]): string {
    if (inv.used_at && inv.used_by) return t.admin.inviteUsed;
    if (inv.used_at) return t.admin.inviteRevoked;
    if (new Date(inv.expires_at) < new Date()) return t.admin.inviteExpired;
    return t.admin.inviteActive;
  }

  const activeLinks = invites
    .filter((inv) => !inv.used_at && new Date(inv.expires_at) >= new Date())
    .map((inv) => `${appUrl}/join/${inv.token}`);

  return (
    <>
      <p className="muted">{t.admin.inviteHint}</p>
      <div className="invite-actions">
        <form action={createInvites} style={{ display: "inline" }}>
          <input type="hidden" name="count" value="1" />
          <SubmitButton>{t.admin.newInvite}</SubmitButton>
        </form>
        <form action={createInvites} style={{ display: "inline" }}>
          <input type="hidden" name="count" value="10" />
          <SubmitButton>{t.admin.newInvites10}</SubmitButton>
        </form>
        {activeLinks.length > 0 && (
          <DownloadInvites links={activeLinks} label={t.admin.downloadInvites} />
        )}
      </div>

      <table className="admin" style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>{t.admin.inviteLink}</th>
            <th>{t.admin.created}</th>
            <th>{t.admin.expires}</th>
            <th>{t.admin.inviteStatus}</th>
            <th>{t.admin.actions}</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => {
            const st = status(inv);
            const active = st === t.admin.inviteActive;
            return (
              <tr key={inv.id}>
                <td>
                  {active ? (
                    <CopyLink url={`${appUrl}/join/${inv.token}`} copyLabel={t.admin.copy} />
                  ) : (
                    <span className="muted">&mdash;</span>
                  )}
                </td>
                <td>{formatDate(inv.created_at)}</td>
                <td>{formatDate(inv.expires_at)}</td>
                <td>{st}</td>
                <td>
                  {active && (
                    <form action={revokeInvite} style={{ display: "inline" }}>
                      <input type="hidden" name="inviteId" value={inv.id} />
                      <button type="submit">{t.admin.revoke}</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
