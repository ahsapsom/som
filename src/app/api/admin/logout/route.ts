import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  if (process.env.SITE_URL) return process.env.SITE_URL;
  return "https://example.com";
}

export async function POST(req: NextRequest) {
  const base = getBaseUrl(req);
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return Response.redirect(
      new URL("/admin/login?error=missing-env", base),
      307,
    );
  }
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return Response.redirect(new URL("/admin/login", base), 307);
}
