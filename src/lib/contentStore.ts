import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

import { SiteContentSchema, type SiteContent } from "@/lib/contentSchema";
import {
  normalizeImageSrc,
  normalizeOptionalImageSrc,
} from "@/lib/imagePath";

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");
const s3 = new S3Client({ region: getRegion() });

declare global {
  // eslint-disable-next-line no-var
  var __contentStoreTargetPromise:
    | Promise<{ bucket: string; key: string } | null>
    | undefined;
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

async function getS3Target(): Promise<{ bucket: string; key: string } | null> {
  const bucket = process.env.ADMIN_CONTENT_BUCKET;
  const key = process.env.ADMIN_CONTENT_KEY;
  if (bucket && key) return { bucket, key };

  if (!globalThis.__contentStoreTargetPromise) {
    globalThis.__contentStoreTargetPromise = readSsmTarget().catch(() => null);
  }
  const ssmTarget = await globalThis.__contentStoreTargetPromise;
  if (!ssmTarget?.bucket || !ssmTarget?.key) return null;
  return ssmTarget;
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

async function readContentFromFile(): Promise<SiteContent> {
  const raw = await readFile(CONTENT_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const validated = SiteContentSchema.parse(parsed);
  return normalizeContentImages(validated);
}

export async function readContent(): Promise<SiteContent> {
  const target = await getS3Target();
  if (!target) {
    return readContentFromFile();
  }
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: target.bucket, Key: target.key }),
    );
    const raw = await bodyToString(response.Body);
    if (!raw) {
      return readContentFromFile();
    }
    const parsed = JSON.parse(raw) as unknown;
    const validated = SiteContentSchema.parse(parsed);
    return normalizeContentImages(validated);
  } catch (err) {
    if (isNoSuchKey(err)) {
      return readContentFromFile();
    }
    throw err;
  }
}

export async function writeContent(next: SiteContent): Promise<void> {
  const validated = SiteContentSchema.parse(next);
  const normalized = normalizeContentImages(validated);
  const target = await getS3Target();
  if (target) {
    await s3.send(
      new PutObjectCommand({
        Bucket: target.bucket,
        Key: target.key,
        Body: JSON.stringify(normalized),
        ContentType: "application/json",
      }),
    );
    return;
  }
  const dir = path.dirname(CONTENT_PATH);
  const tmp = path.join(dir, `content.${Date.now()}.tmp.json`);
  await writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
  await rename(tmp, CONTENT_PATH);
}

export function getContentPath() {
  return CONTENT_PATH;
}

function normalizeContentImages(content: SiteContent): SiteContent {
  return {
    ...content,
    seo: {
      ...content.seo,
      ogImage: normalizeOptionalImageSrc(content.seo.ogImage),
    },
    brand: {
      ...content.brand,
      logo: normalizeOptionalImageSrc(content.brand.logo),
    },
    hero: {
      ...content.hero,
      heroImage: content.hero.heroImage
        ? {
            ...content.hero.heroImage,
            src: normalizeImageSrc(content.hero.heroImage.src),
            thumb: normalizeOptionalImageSrc(content.hero.heroImage.thumb),
          }
        : undefined,
    },
    about: {
      ...content.about,
      image: content.about.image
        ? {
            ...content.about.image,
            src: normalizeImageSrc(content.about.image.src),
            thumb: normalizeOptionalImageSrc(content.about.image.thumb),
          }
        : undefined,
    },
    products: {
      ...content.products,
      cards: content.products.cards.map((card) => ({
        ...card,
        image: card.image
          ? {
              ...card.image,
              src: normalizeImageSrc(card.image.src),
              thumb: normalizeOptionalImageSrc(card.image.thumb),
            }
          : undefined,
      })),
    },
    gallery: {
      ...content.gallery,
      images: content.gallery.images.map((image) => ({
        ...image,
        src: normalizeImageSrc(image.src),
        thumb: normalizeOptionalImageSrc(image.thumb),
      })),
    },
  };
}
