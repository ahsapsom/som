import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminApp } from "@/app/admin/AdminApp";
import { logoutAction } from "@/app/admin/login/actions";
import { verifyAdminSessionToken } from "@/lib/adminAuth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!verifyAdminSessionToken(token)) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-end">
          <form action={logoutAction}>
            <button
              type="submit"
              className="focus-ring inline-flex h-10 items-center justify-center rounded-full border border-border/80 bg-card/60 px-5 text-sm hover:bg-card/80"
            >
              Çıkış
            </button>
          </form>
        </div>
        <AdminApp />
      </div>
    </main>
  );
}
