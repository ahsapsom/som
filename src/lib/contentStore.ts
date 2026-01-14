import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { SiteContentSchema, type SiteContent } from "@/lib/contentSchema";

const CONTENT_PATH = path.join(process.cwd(), "data", "content.json");

export async function readContent(): Promise<SiteContent> {
  const raw = await readFile(CONTENT_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return SiteContentSchema.parse(parsed);
}

export async function writeContent(next: SiteContent): Promise<void> {
  const validated = SiteContentSchema.parse(next);
  const dir = path.dirname(CONTENT_PATH);
  const tmp = path.join(dir, `content.${Date.now()}.tmp.json`);
  await writeFile(tmp, JSON.stringify(validated, null, 2), "utf8");
  await rename(tmp, CONTENT_PATH);
}

export function getContentPath() {
  return CONTENT_PATH;
}

