export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getAdminEnv } from "@/lib/adminEnv";

export async function GET(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const keysSample = Object.keys(process.env)
    .filter((key) => key.includes("ADMIN") || key.includes("AMPLIFY"))
    .slice(0, 50);
  const { ADMIN_PASSWORD, ADMIN_SECRET, hasSecretsObject } = getAdminEnv();
  return Response.json({
    ok: true,
    router: "app",
    hasAdminPassword: Boolean(ADMIN_PASSWORD),
    hasAdminSecret: Boolean(ADMIN_SECRET),
    hasSecretsObject,
    keysSample,
    host,
    proto,
  });
}
