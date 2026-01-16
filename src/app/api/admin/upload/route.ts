import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";
import { getCookieValue, verifyAdminSessionToken } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireAdmin(req: Request) {
  const token = getCookieValue(req.headers.get("cookie"), "admin");
  if (!(await verifyAdminSessionToken(token))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { ok: false, error: "Dosya bulunamadı." },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return Response.json(
      { ok: false, error: "Sadece görsel yüklenebilir." },
      { status: 400 },
    );
  }

  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return Response.json(
      { ok: false, error: "Dosya çok büyük (max 5MB)." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = (file.name || "image")
    .toLowerCase()
    .replaceAll(/[^a-z0-9._-]+/g, "-")
    .slice(0, 80);
  const ext = path.extname(safeName) || ".png";
  const base = path.basename(safeName, ext);
  const filename = `${Date.now()}-${base}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const targetPath = path.join(uploadDir, filename);
  await writeFile(targetPath, bytes);

  let thumb: string | undefined;
  if (!file.type.includes("svg")) {
    const thumbFilename = `${base}-${Date.now()}-thumb.jpg`;
    const thumbPath = path.join(uploadDir, thumbFilename);
    await sharp(bytes)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toFile(thumbPath);
    thumb = `/uploads/${thumbFilename}`;
  } else {
    thumb = `/uploads/${filename}`;
  }

  return Response.json({
    ok: true,
    src: `/uploads/${filename}`,
    thumb,
  });
}
