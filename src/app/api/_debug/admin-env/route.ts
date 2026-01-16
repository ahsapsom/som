import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (process.env.DEBUG_ADMIN_ENV !== "1") {
    return new Response(null, { status: 404 });
  }
  return NextResponse.json({
    reqUrl: req.url,
    host: req.headers.get("host"),
    xfHost: req.headers.get("x-forwarded-host"),
    xfProto: req.headers.get("x-forwarded-proto"),
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    hasSiteUrl: Boolean(process.env.SITE_URL),
    siteUrlValue: process.env.SITE_URL ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
