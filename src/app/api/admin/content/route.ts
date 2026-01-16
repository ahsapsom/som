import { Readable } from "node:stream";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { SiteContentSchema } from "@/lib/contentSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const s3 = new S3Client({
  region: process.env.AWS_REGION || "eu-central-1",
});

declare global {
  // eslint-disable-next-line no-var
  var __adminContentTargetPromise:
    | Promise<{ bucket: string; key: string }>
    | undefined;
}

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

function getRegion() {
  return (
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION ??
    "eu-central-1"
  );
}

function getAppId() {
  return (
    process.env.AMPLIFY_APP_ID ??
    process.env.AWS_AMPLIFY_APP_ID ??
    "d3b993v3dgpwkg"
  );
}

function getBranch() {
  return (
    process.env.AMPLIFY_BRANCH ??
    process.env.AWS_AMPLIFY_BRANCH ??
    "main"
  );
}

async function readSsmTarget(): Promise<{ bucket: string; key: string }> {
  const appId = getAppId();
  const branch = getBranch();
  const names = [
    `/amplify/${appId}/${branch}/ADMIN_CONTENT_BUCKET`,
    `/amplify/${appId}/${branch}/ADMIN_CONTENT_KEY`,
  ];
  const client = new SSMClient({ region: getRegion() });
  const response = await client.send(
    new GetParametersCommand({ Names: names, WithDecryption: true }),
  );
  const paramMap = new Map(
    (response.Parameters ?? []).map((param) => [
      param.Name ?? "",
      param.Value ?? "",
    ]),
  );
  return {
    bucket: (paramMap.get(names[0]) ?? "").trim(),
    key: (paramMap.get(names[1]) ?? "").trim(),
  };
}

async function getS3Target() {
  const bucket = process.env.ADMIN_CONTENT_BUCKET;
  const key = process.env.ADMIN_CONTENT_KEY;
  if (!bucket || !key) {
    if (!globalThis.__adminContentTargetPromise) {
      globalThis.__adminContentTargetPromise = readSsmTarget().catch(() => ({
        bucket: "",
        key: "",
      }));
    }
    const ssmTarget = await globalThis.__adminContentTargetPromise;
    if (!ssmTarget.bucket || !ssmTarget.key) {
      throw new Error("Missing ADMIN_CONTENT_BUCKET or ADMIN_CONTENT_KEY");
    }
    return ssmTarget;
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
    const { bucket, key } = await getS3Target();
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
    const { bucket, key } = await getS3Target();
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
