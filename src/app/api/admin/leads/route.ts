import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";
import { deleteLead, readLeads } from "@/lib/leadStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function requireAdmin(req: Request) {
  const token = getCookieValue(req.headers.get("cookie"), "admin");
  if (!verifyAdminSessionToken(token)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const leads = await readLeads();
  return Response.json({ ok: true, leads });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json(
      { ok: false, error: "ID gerekli." },
      { status: 400 },
    );
  }
  await deleteLead(id);
  return Response.json({ ok: true });
}
