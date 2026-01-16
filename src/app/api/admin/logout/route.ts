import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
  if (!ADMIN_SECRET) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing-env", req.url),
      307,
    );
  }
  const res = NextResponse.redirect(new URL("/admin/login", req.url), 307);
  res.cookies.set("admin", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
