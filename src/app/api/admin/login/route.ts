import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createAdminSessionToken,
  getAdminPassword,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function logAdminEnvIfEnabled() {
  if (process.env.DEBUG_ADMIN_ENV !== "1") return;
  const adminPassword = getAdminPassword();
  console.log("ENV_HAS_ADMIN_PASSWORD", Boolean(adminPassword));
  console.log("ENV_ADMIN_PASSWORD_LEN", adminPassword?.length ?? 0);
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.BUILD_SHA ?? "";
  console.log("ADMIN_BUILD_ID", buildId);
}

export async function POST(req: Request) {
  logAdminEnvIfEnabled();
  const adminPassword = getAdminPassword();
  if (!adminPassword) {
    return NextResponse.redirect(
      new URL("/admin/login?error=missing-env", req.url),
    );
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!password.trim()) {
    return NextResponse.redirect(
      new URL("/admin/login?error=required", req.url),
    );
  }
  if (!verifyAdminPassword(password, adminPassword)) {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid", req.url),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.redirect(new URL("/admin", req.url));
}
