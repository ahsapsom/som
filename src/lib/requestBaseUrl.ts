import type { NextRequest } from "next/server";

export function getRedirectUrl(
  req: NextRequest,
  path: string,
): string | URL {
  const xfHost = req.headers.get("x-forwarded-host");
  const host = xfHost ?? req.headers.get("host") ?? req.nextUrl.host;
  const normalizedHost = host?.split(",")[0]?.trim() ?? "";
  if (!normalizedHost || normalizedHost.includes("localhost")) {
    return path;
  }

  const protoHeader = req.headers.get("x-forwarded-proto");
  const proto =
    protoHeader?.split(",")[0]?.trim() ||
    req.nextUrl.protocol?.replace(":", "") ||
    "https";
  const baseUrl = `${proto}://${normalizedHost}`;
  return new URL(path, baseUrl);
}
