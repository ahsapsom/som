import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

export const MailSettingsSchema = z.object({
  smtpHost: z.string().optional().default(""),
  smtpPort: z.string().optional().default(""),
  smtpSecure: z.boolean().optional().default(false),
  smtpUser: z.string().optional().default(""),
  smtpPass: z.string().optional().default(""),
  mailFrom: z.string().optional().default(""),
  mailTo: z.string().optional().default(""),
});

export type MailSettings = z.infer<typeof MailSettingsSchema>;

const DEFAULT_SETTINGS: MailSettings = {
  smtpHost: "",
  smtpPort: "",
  smtpSecure: false,
  smtpUser: "",
  smtpPass: "",
  mailFrom: "",
  mailTo: "",
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "mailbox.json");

async function ensureExists() {
  try {
    await readFile(SETTINGS_PATH, "utf8");
  } catch {
    await writeFile(
      SETTINGS_PATH,
      JSON.stringify(DEFAULT_SETTINGS, null, 2),
      "utf8",
    );
  }
}

export async function readMailSettings(): Promise<MailSettings> {
  await ensureExists();
  const raw = await readFile(SETTINGS_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return MailSettingsSchema.parse(parsed);
}

export async function writeMailSettings(next: MailSettings): Promise<void> {
  const validated = MailSettingsSchema.parse(next);
  const dir = path.dirname(SETTINGS_PATH);
  const tmp = path.join(dir, `mailbox.${Date.now()}.tmp.json`);
  await writeFile(tmp, JSON.stringify(validated, null, 2), "utf8");
  await rename(tmp, SETTINGS_PATH);
}

export function getMailSettingsPath() {
  return SETTINGS_PATH;
}
