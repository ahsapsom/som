import { NextResponse, type NextRequest } from "next/server";

import {
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";
import { getAdminEnv } from "@/lib/adminEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getPublicOrigin(req: NextRequest) {
  const protoHeader = req.headers.get("x-forwarded-proto") ?? "https";
  const proto = protoHeader.split(",")[0]?.trim() || "https";
  const hostHeader =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const host = hostHeader?.split(",")[0]?.trim();
  if (host) return `${proto}://${host}`;
  return "https://somahsap.com";
}

function logAdminEnvIfEnabled(
  adminPassword: string | undefined,
  adminSecret: string | undefined,
) {
  if (process.env.DEBUG_ADMIN_ENV !== "1") return;
  console.log("ENV_HAS_ADMIN_PASSWORD", Boolean(adminPassword));
  console.log("ENV_ADMIN_PASSWORD_LEN", adminPassword?.length ?? 0);
  console.log("ENV_HAS_ADMIN_SECRET", Boolean(adminSecret));
  console.log("ENV_ADMIN_SECRET_LEN", adminSecret?.length ?? 0);
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.BUILD_SHA ?? "";
  console.log("ADMIN_BUILD_ID", buildId);
}

export async function POST(req: NextRequest) {
  try {
    const { ADMIN_PASSWORD, ADMIN_SECRET } = await getAdminEnv();
    logAdminEnvIfEnabled(ADMIN_PASSWORD, ADMIN_SECRET);
    const origin = getPublicOrigin(req);
    if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
      const missing = [];
      if (!ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
      if (!ADMIN_SECRET) missing.push("ADMIN_SECRET");
      console.log("ADMIN_ENV_MISSING", missing.join(",") || "unknown");
      const res = NextResponse.redirect(
        new URL("/admin/login?error=missing-env", origin),
        307,
      );
      res.headers.set("x-admin-missing", missing.join(","));
      return res;
    }
    const form = await req.formData();
    const password = String(form.get("password") ?? "");
    if (!password.trim()) {
      return NextResponse.redirect(
        new URL("/admin/login?error=required", origin),
        307,
      );
    }
    if (!verifyAdminPassword(password, ADMIN_PASSWORD)) {
      return NextResponse.redirect(
        new URL("/admin/login?error=invalid-password", origin),
        307,
      );
    }

    const token = await createAdminSessionToken();
    const res = NextResponse.redirect(new URL("/admin", origin), 307);
    res.cookies.set("admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error) {
    console.error("ADMIN_LOGIN_FAILED", error);
    const res = NextResponse.redirect(
      new URL("/admin/login?error=missing-env", getPublicOrigin(req)),
      307,
    );
    res.headers.set("x-admin-error", "login-exception");
    res.headers.set(
      "x-admin-error-msg",
      String(error instanceof Error ? error.message : error),
    );
    return res;
  }
}
