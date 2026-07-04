import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export default async function PendingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "approved") redirect("/");
  const t = await getT();

  return (
    <div className="login-box">
      <h1>{t.pending.title}</h1>
      <p>
        {t.pending.before}
        <b>{user.email}</b>
        {t.pending.after}
      </p>
    </div>
  );
}
