import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { SiteContentSchema } from "@/lib/contentSchema";
import { readContent, writeContent } from "@/lib/contentStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const content = await readContent();
  return Response.json({ ok: true, content });
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
    await writeContent(parsed.data);
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
