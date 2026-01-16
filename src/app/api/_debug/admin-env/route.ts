export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return Response.json({
    ok: true,
    router: "app",
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    host,
    proto,
  });
}
