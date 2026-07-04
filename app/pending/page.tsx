import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function PendingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status === "approved") redirect("/");

  return (
    <div className="login-box">
      <h1>Application received</h1>
      <p>
        Your application (<b>{user.email}</b>) is pending manual approval.
      </p>
    </div>
  );
}
