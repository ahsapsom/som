import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { getAdminSecrets } from "@/lib/adminSecrets";
import { SiteContentSchema } from "@/lib/contentSchema";
import { readContent, writeContent } from "@/lib/contentStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin(req: Request) {
  const { adminSecret } = await getAdminSecrets();
  if (!adminSecret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const token = getCookieValue(req.headers.get("cookie"), "admin_session");
  if (!verifyAdminSessionToken(token, adminSecret)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const content = await readContent();
  return Response.json({ ok: true, content });
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const json = await req.json();
  const parsed = SiteContentSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: "Validation error",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  await writeContent(parsed.data);
  return Response.json({ ok: true });
}
