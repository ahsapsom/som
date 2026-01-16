export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return Response.json({
    hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
    hasAdminSecret: Boolean(process.env.ADMIN_SECRET),
    siteUrl: process.env.SITE_URL ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
