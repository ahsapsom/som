import crypto from "node:crypto";

type SessionPayload = { v: 1; iat: number; exp: number };

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string) {
  const pad = input.length % 4 ? "=".repeat(4 - (input.length % 4)) : "";
  const b64 = input.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

function getRequiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
}

export function verifyAdminPassword(password: string, expected?: string) {
  const resolved = expected ?? process.env.ADMIN_PASSWORD;
  if (!resolved) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(resolved);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(input: string) {
  const secret = getRequiredEnv("ADMIN_SECRET");
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(input).digest(),
  );
}

export function createAdminSessionToken(days = 7) {
  const now = Date.now();
  const payload: SessionPayload = {
    v: 1,
    iat: now,
    exp: now + days * 24 * 60 * 60 * 1000,
  };
  const data = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(data);
  return `${data}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  const payload = JSON.parse(base64UrlDecode(data)) as SessionPayload;
  if (payload?.v !== 1) return false;
  if (typeof payload.exp !== "number") return false;
  return Date.now() < payload.exp;
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx);
    if (k !== name) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return undefined;
}
