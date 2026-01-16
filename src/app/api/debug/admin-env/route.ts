export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const keysSample = Object.keys(process.env)
    .filter((key) => key.includes("ADMIN") || key.includes("AMPLIFY"))
    .slice(0, 50);
  return Response.json({
    ok: true,
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    keysSample,
    host,
    proto,
  });
}
