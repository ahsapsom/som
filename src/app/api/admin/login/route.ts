import { cookies } from "next/headers";
import { type NextRequest } from "next/server";

import {
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBaseUrl(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
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
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  logAdminEnvIfEnabled(ADMIN_PASSWORD, ADMIN_SECRET);
  const base = getBaseUrl(req);
  if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
    const missing: string[] = [];
    if (!ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");
    if (!ADMIN_SECRET) missing.push("ADMIN_SECRET");
    console.log("ADMIN_ENV_MISSING", missing.join(",") || "unknown");
    const res = Response.redirect(
      new URL("/admin/login?error=missing-env", base),
      307,
    );
    res.headers.set("x-admin-missing", missing.join(","));
    return res;
  }

  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  if (!password.trim()) {
    return Response.redirect(
      new URL("/admin/login?error=required", base),
      307,
    );
  }
  if (!verifyAdminPassword(password, ADMIN_PASSWORD)) {
    return Response.redirect(
      new URL("/admin/login?error=invalid-password", base),
      307,
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

  return Response.redirect(new URL("/admin", base), 307);
}
