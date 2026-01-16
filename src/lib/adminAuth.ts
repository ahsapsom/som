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

export function verifyAdminPassword(password: string, expected: string) {
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getAdminSecret() {
  const direct = process.env.ADMIN_SECRET;
  if (direct) return direct;
  const secretsRaw = (process.env as Record<string, unknown>).secrets;
  if (!secretsRaw) return null;
  if (typeof secretsRaw === "string") {
    try {
      const parsed = JSON.parse(secretsRaw) as Record<string, unknown>;
      const value = parsed.ADMIN_SECRET;
      return typeof value === "string" ? value : null;
    } catch {
      return null;
    }
  }
  if (typeof secretsRaw === "object") {
    const value = (secretsRaw as Record<string, unknown>).ADMIN_SECRET;
    return typeof value === "string" ? value : null;
  }
  return null;
}

function sign(input: string, secret: string) {
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(input).digest(),
  );
}

export function createAdminSessionToken(days = 7) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Missing env: ADMIN_SECRET");
  const now = Date.now();
  const payload: SessionPayload = {
    v: 1,
    iat: now,
    exp: now + days * 24 * 60 * 60 * 1000,
  };
  const data = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(data, secret);
  return `${data}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const secret = getAdminSecret();
  if (!secret) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;
  const expected = sign(data, secret);
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
