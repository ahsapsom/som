import { getAdminSecrets } from "@/lib/adminSecrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const { adminPassword, adminSecret, source } = await getAdminSecrets();
  return Response.json({
    ok: true,
    router: "app",
    hasAdminPassword: Boolean(adminPassword),
    hasAdminSecret: Boolean(adminSecret),
    source,
    host,
    proto,
  });
}
