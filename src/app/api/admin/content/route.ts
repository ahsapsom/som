import { Readable } from "node:stream";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { SiteContentSchema } from "@/lib/contentSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
});

async function requireAdmin(req: Request) {
  const token = getCookieValue(req.headers.get("cookie"), "admin");
  if (!(await verifyAdminSessionToken(token))) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  return null;
}

function getS3Target() {
  const bucket = process.env.ADMIN_CONTENT_BUCKET;
  const key = process.env.ADMIN_CONTENT_KEY;
  if (!bucket || !key) {
    throw new Error("Missing ADMIN_CONTENT_BUCKET or ADMIN_CONTENT_KEY");
  }
  return { bucket, key };
}

function isNoSuchKey(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const candidate = err as {
    name?: string;
    Code?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === "NoSuchKey" ||
    candidate.name === "NotFound" ||
    candidate.Code === "NoSuchKey" ||
    candidate.$metadata?.httpStatusCode === 404
  );
}

async function bodyToString(body: unknown): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return Buffer.from(body).toString("utf8");
  if (body instanceof ArrayBuffer) return Buffer.from(body).toString("utf8");
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return await body.text();
  }
  if (body instanceof Readable) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(chunk);
      }
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  if (typeof (body as ReadableStream).getReader === "function") {
    const reader = (body as ReadableStream).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  return "";
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  try {
    const { bucket, key } = getS3Target();
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const raw = await bodyToString(response.Body);
    if (!raw) {
      return Response.json({ ok: true, content: {} });
    }
    const json = JSON.parse(raw) as unknown;
    const parsed = SiteContentSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ ok: false, error: "bad-content" }, { status: 500 });
    }
    return Response.json({ ok: true, content: parsed.data });
  } catch (err) {
    if (isNoSuchKey(err)) {
      return Response.json({ ok: true, content: {} });
    }
    const debug = process.env.DEBUG_ADMIN_ENV === "1";
    const msg = err instanceof Error
      ? err.message.slice(0, 120)
      : String(err).slice(0, 120);
    console.error("[admin-content] GET exception", err);
    return Response.json(
      {
        ok: false,
        error: "exception",
        name: err instanceof Error ? err.name : "Error",
        message: debug ? (err instanceof Error ? err.message : String(err)) : undefined,
      },
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-admin-error": "content-get-exception",
          "x-admin-error-msg": msg,
          "cache-control": "no-store",
        },
      },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (auth) return auth;
    const json = await req.json();
    const parsed = SiteContentSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
    }
    const { bucket, key } = getS3Target();
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(parsed.data),
        ContentType: "application/json",
      }),
    );
    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    const debug = process.env.DEBUG_ADMIN_ENV === "1";
    const msg = err instanceof Error
      ? err.message.slice(0, 120)
      : String(err).slice(0, 120);
    console.error("[admin-content] PUT exception", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "exception",
        name: err instanceof Error ? err.name : "Error",
        message: debug ? (err instanceof Error ? err.message : String(err)) : undefined,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-admin-error": "content-exception",
          "x-admin-error-msg": msg,
          "cache-control": "no-store",
        },
      },
    );
  }
}
