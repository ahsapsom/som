import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { MailSettingsSchema } from "@/lib/mailSettingsStore";
import { readMailSettings, writeMailSettings } from "@/lib/mailSettingsStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function requireAdmin(req: Request) {
  const token = getCookieValue(req.headers.get("cookie"), "admin_session");
  if (!verifyAdminSessionToken(token)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const settings = await readMailSettings();
  return Response.json({ ok: true, settings });
}

export async function PUT(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const json = await req.json();
  const parsed = MailSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Validation error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  await writeMailSettings(parsed.data);
  return Response.json({ ok: true });
}
