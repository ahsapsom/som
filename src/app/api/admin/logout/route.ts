import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

import { getRedirectUrl } from "@/lib/requestBaseUrl";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return Response.redirect(
      getRedirectUrl(req, "/admin/login?error=missing-env"),
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

  return Response.redirect(getRedirectUrl(req, "/admin/login"), 307);
}
