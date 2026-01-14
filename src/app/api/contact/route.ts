import crypto from "node:crypto";
import { z } from "zod";

import { appendLead } from "@/lib/leadStore";
import { sendMail } from "@/lib/mailer";
import { readContent } from "@/lib/contentStore";

const MAIL_TIMEOUT_MS = 8_000;

async function sendMailWithTimeout(args: Parameters<typeof sendMail>[0]) {
  return await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Mail gönderimi zaman aşımına uğradı."));
    }, MAIL_TIMEOUT_MS);
    sendMail(args)
      .then(() => {
        clearTimeout(timer);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

const Base = z.object({
  email: z.string().email("Geçerli bir e-posta yazın."),
  notes: z.string().max(2000).optional().default(""),
  company: z.string().optional().default(""), // honeypot
  consent: z.literal(true),
});

const Quote = Base.extend({
  type: z.literal("quote"),
  phone: z
    .string()
    .min(7, "Telefon numarası çok kısa.")
    .max(30, "Telefon numarası çok uzun."),
  usageArea: z.string().min(2).max(60),
  woodType: z.string().min(2).max(60),
  thicknessMm: z.number().int().min(12).max(120),
  quality: z.enum(["AB", "BB", "CC", "CD"]),
  lengthMm: z.number().int().min(100).max(6000).optional(),
  widthMm: z.number().int().min(100).max(2000).optional(),
  quantity: z.number().int().min(1).max(100).optional(),
});

const Message = Base.extend({
  type: z.literal("message"),
  phone: z
    .string()
    .min(7, "Telefon numarası çok kısa.")
    .max(30, "Telefon numarası çok uzun."),
  name: z.string().min(2).max(60),
  subject: z.string().min(2).max(120),
  message: z.string().min(10).max(3000),
});

const Quick = Base.extend({
  type: z.literal("quick"),
});

const Payload = z.discriminatedUnion("type", [Quote, Message, Quick]);

function esc(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const content = await readContent().catch(() => null);
    const sourceName = content?.brand?.name ?? "Web Sitesi";

    const json = await req.json();
    const parsed = Payload.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          error: "Form doğrulama hatası.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (data.company?.trim()) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const baseText = [
      `Kaynak: ${sourceName} web formu`,
      `E-posta: ${data.email}`,
      "phone" in data ? `Telefon: ${data.phone}` : "",
      data.notes ? `Açıklama: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (data.type === "quote") {
      const areaM2 =
        data.lengthMm && data.widthMm
          ? ((data.lengthMm * data.widthMm) / 1_000_000) *
            (data.quantity ?? 1)
          : undefined;

      const subject = `Teklif Talebi — ${data.usageArea} / ${data.woodType} / ${data.quality}`;
      const text = [
        subject,
        "",
        `Kullanım Alanı: ${data.usageArea}`,
        `Ahşap Türü: ${data.woodType}`,
        `Kalınlık: ${data.thicknessMm} mm`,
        `Kalite: ${data.quality}`,
        data.lengthMm ? `Boy: ${data.lengthMm} mm` : "",
        data.widthMm ? `En: ${data.widthMm} mm` : "",
        data.quantity ? `Adet: ${data.quantity}` : "",
        areaM2 ? `Tahmini Alan: ${areaM2.toFixed(2)} m²` : "",
        "",
        baseText,
      ]
        .filter(Boolean)
        .join("\n");

      const html = `
        <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">${esc(subject)}</h2>
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr><td style="padding:6px 10px;color:#666">Kullanım</td><td style="padding:6px 10px"><b>${esc(data.usageArea)}</b></td></tr>
            <tr><td style="padding:6px 10px;color:#666">Ahşap</td><td style="padding:6px 10px"><b>${esc(data.woodType)}</b></td></tr>
            <tr><td style="padding:6px 10px;color:#666">Kalınlık</td><td style="padding:6px 10px"><b>${data.thicknessMm} mm</b></td></tr>
            <tr><td style="padding:6px 10px;color:#666">Kalite</td><td style="padding:6px 10px"><b>${esc(data.quality)}</b></td></tr>
            ${
              data.lengthMm
                ? `<tr><td style="padding:6px 10px;color:#666">Boy</td><td style="padding:6px 10px"><b>${data.lengthMm} mm</b></td></tr>`
                : ""
            }
            ${
              data.widthMm
                ? `<tr><td style="padding:6px 10px;color:#666">En</td><td style="padding:6px 10px"><b>${data.widthMm} mm</b></td></tr>`
                : ""
            }
            ${
              data.quantity
                ? `<tr><td style="padding:6px 10px;color:#666">Adet</td><td style="padding:6px 10px"><b>${data.quantity}</b></td></tr>`
                : ""
            }
            ${
              areaM2
                ? `<tr><td style="padding:6px 10px;color:#666">Tahmini Alan</td><td style="padding:6px 10px"><b>${areaM2.toFixed(
                    2,
                  )} m²</b></td></tr>`
                : ""
            }
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <pre style="white-space:pre-wrap;margin:0">${esc(baseText)}</pre>
        </div>
      `.trim();

      await appendLead({
        id: crypto.randomUUID(),
        type: "quote",
        email: data.email,
        phone: data.phone,
        payload: {
          usageArea: data.usageArea,
          woodType: data.woodType,
          quality: data.quality,
          thicknessMm: data.thicknessMm,
          lengthMm: data.lengthMm,
          widthMm: data.widthMm,
          quantity: data.quantity,
        },
        notes: data.notes,
        createdAt: new Date().toISOString(),
      });
      try {
        await sendMailWithTimeout({
          subject,
          text,
          html,
          replyTo: data.email,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Mail gönderilemedi.";
        return Response.json(
          { ok: false, error: "Mail gönderilemedi.", message },
          { status: 502 },
        );
      }
      return Response.json({ ok: true }, { status: 200 });
    }

    if (data.type === "quick") {
      const subject = "Hızlı İletişim Talebi";
      const text = [subject, "", baseText].join("\n");
      const html = `
        <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
          <h2 style="margin:0 0 12px">${esc(subject)}</h2>
          <pre style="white-space:pre-wrap;margin:0">${esc(baseText)}</pre>
        </div>
      `.trim();

      await appendLead({
        id: crypto.randomUUID(),
        type: "quick",
        email: data.email,
        phone: "",
        payload: {
          source: "quick",
        },
        notes: data.notes,
        createdAt: new Date().toISOString(),
      });
      try {
        await sendMailWithTimeout({
          subject,
          text,
          html,
          replyTo: data.email,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Mail gönderilemedi.";
        return Response.json(
          { ok: false, error: "Mail gönderilemedi.", message },
          { status: 502 },
        );
      }
      return Response.json({ ok: true }, { status: 200 });
    }

    const subject = `Yeni Mesaj — ${data.subject}`;
    const text = [
      subject,
      "",
      `Ad Soyad: ${data.name}`,
      `Konu: ${data.subject}`,
      "",
      data.message,
      "",
      baseText,
    ].join("\n");

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6">
        <h2 style="margin:0 0 12px">${esc(subject)}</h2>
        <p style="margin:0 0 10px"><b>${esc(data.name)}</b> size bir mesaj gönderdi.</p>
        <p style="margin:0 0 10px"><b>Konu:</b> ${esc(data.subject)}</p>
        <div style="border:1px solid #eee;border-radius:10px;padding:12px;background:#fafafa">
          ${esc(data.message).replaceAll("\n", "<br/>")}
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <pre style="white-space:pre-wrap;margin:0">${esc(baseText)}</pre>
      </div>
    `.trim();

    await appendLead({
      id: crypto.randomUUID(),
      type: "message",
      email: data.email,
      phone: data.phone,
      payload: {
        name: data.name,
        subject: data.subject,
        message: data.message,
      },
      notes: data.notes,
      createdAt: new Date().toISOString(),
    });
    try {
      await sendMailWithTimeout({
        subject,
        text,
        html,
        replyTo: data.email,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Mail gönderilemedi.";
      return Response.json(
        { ok: false, error: "Mail gönderilemedi.", message },
        { status: 502 },
      );
    }
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
    return Response.json(
      { ok: false, error: "Mail gönderilemedi.", message },
      { status: 500 },
    );
  }
}
