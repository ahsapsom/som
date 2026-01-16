import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  return NextResponse.json({
    hasAdminPassword: Boolean(process.env["ADMIN_PASSWORD"]),
    hasAdminSecret: Boolean(process.env["ADMIN_SECRET"]),
    hasSiteUrl: Boolean(process.env["SITE_URL"]),
    host: req.headers.get("host"),
    xForwardedHost: req.headers.get("x-forwarded-host"),
    xForwardedProto: req.headers.get("x-forwarded-proto"),
  });
}
