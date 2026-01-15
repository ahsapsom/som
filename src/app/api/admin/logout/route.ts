import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getRedirectUrl } from "@/lib/requestBaseUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.redirect(getRedirectUrl(req, "/admin/login"), 307);
}
