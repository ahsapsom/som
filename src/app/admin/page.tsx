import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminApp } from "@/app/admin/AdminApp";
import { verifyAdminSessionToken } from "@/lib/adminAuth";
import { getAdminSecrets } from "@/lib/adminSecrets";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const { adminSecret } = await getAdminSecrets();
  if (!adminSecret || !verifyAdminSessionToken(token, adminSecret)) {
    redirect("/admin/login");
  }
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.BUILD_SHA ?? "local";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-end">
          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="focus-ring inline-flex h-10 items-center justify-center rounded-full border border-border/80 bg-card/60 px-5 text-sm hover:bg-card/80"
            >
              Çıkış
            </button>
          </form>
        </div>
        <AdminApp />
        <p className="mt-10 text-xs text-muted">Build: {buildId}</p>
      </div>
    </main>
  );
}
