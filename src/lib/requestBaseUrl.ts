import type { NextRequest } from "next/server";

const FALLBACK_BASE_URL = "https://somahsap.com";

function getHeaderValue(req: NextRequest, name: string) {
  const value = req.headers.get(name);
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

export function getRedirectUrl(req: NextRequest, path: string) {
  const proto = getHeaderValue(req, "x-forwarded-proto") ?? "https";
  const host =
    getHeaderValue(req, "x-forwarded-host") ?? getHeaderValue(req, "host");
  if (host) {
    return new URL(path, `${proto}://${host}`);
  }
  const siteUrl = process.env.SITE_URL?.trim();
  if (siteUrl) {
    const normalized =
      siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
        ? siteUrl
        : `https://${siteUrl}`;
    return new URL(path, normalized);
  }
  return new URL(path, FALLBACK_BASE_URL);
}
