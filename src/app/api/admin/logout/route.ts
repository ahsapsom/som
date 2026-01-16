import { NextResponse, type NextRequest } from "next/server";

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

function getSecretEnvValue(key: "ADMIN_SECRET") {
  const direct = process.env[key];
  if (direct) return direct;
  const secretsRaw = (process.env as Record<string, unknown>).secrets;
  if (!secretsRaw) return "";
  if (typeof secretsRaw === "string") {
    try {
      const parsed = JSON.parse(secretsRaw) as Record<string, unknown>;
      const value = parsed[key];
      return typeof value === "string" ? value : "";
    } catch {
      return "";
    }
  }
  if (typeof secretsRaw === "object") {
    const value = (secretsRaw as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  }
  return "";
}

export async function POST(req: NextRequest) {
  const ADMIN_SECRET = getSecretEnvValue("ADMIN_SECRET");
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
