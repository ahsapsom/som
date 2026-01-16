import { NextResponse, type NextRequest } from "next/server";

import { getAdminEnv } from "@/lib/adminEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getPublicOrigin(req: NextRequest) {
  const origin = new URL(req.url).origin;
  return origin.includes("localhost") ? "https://somahsap.com" : origin;
}

export async function POST(req: NextRequest) {
  const { ADMIN_SECRET } = getAdminEnv();
  if (!ADMIN_SECRET) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing-env", getPublicOrigin(req)),
      307,
    );
  }
  const res = NextResponse.redirect(
    new URL("/admin/login", getPublicOrigin(req)),
    307,
  );
  res.cookies.set("admin", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
