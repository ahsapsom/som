import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type LeadEntry = {
  id: string;
  type: "quote" | "message" | "quick";
  email: string;
  phone: string;
  createdAt: string;
  payload: Record<string, unknown>;
  notes?: string;
  status?: "new" | "contacted" | "closed";
};

const LEADS_PATH = path.join(process.cwd(), "data", "leads.json");

async function ensureExists() {
  try {
    await readFile(LEADS_PATH, "utf8");
  } catch {
    await writeFile(LEADS_PATH, "[]", "utf8");
  }
}

export async function readLeads(): Promise<LeadEntry[]> {
  await ensureExists();
  const raw = await readFile(LEADS_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as LeadEntry[];
}

export async function appendLead(next: LeadEntry): Promise<void> {
  const leads = await readLeads();
  leads.unshift(next);
  const tmp = `${LEADS_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(leads, null, 2), "utf8");
  await rename(tmp, LEADS_PATH);
}

export async function deleteLead(id: string): Promise<void> {
  const leads = await readLeads();
  const next = leads.filter((lead) => lead.id !== id);
  const tmp = `${LEADS_PATH}.tmp`;
  await writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await rename(tmp, LEADS_PATH);
}
