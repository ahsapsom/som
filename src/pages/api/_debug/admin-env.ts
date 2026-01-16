import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    router: "pages",
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasAdminSecret: !!process.env.ADMIN_SECRET,
    host: req.headers["x-forwarded-host"] ?? req.headers.host ?? null,
    proto: req.headers["x-forwarded-proto"] ?? "https",
  });
}
