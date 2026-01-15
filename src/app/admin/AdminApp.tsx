"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SiteContent } from "@/lib/contentSchema";
import type { LeadEntry } from "@/lib/leadStore";
import { normalizeImageSrc } from "@/lib/imagePath";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saving" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type MailSettings = {
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
  mailTo: string;
};

function TextInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground/85">
        {props.label}
      </span>
      <input
        className="focus-ring h-11 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
        value={props.value}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      />
    </label>
  );
}

function Textarea(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground/85">
        {props.label}
      </span>
      <textarea
        className="focus-ring min-h-28 resize-y rounded-xl border border-border/80 bg-surface/60 px-3 py-2 text-sm"
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      />
    </label>
  );
}

function SelectInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground/85">
        {props.label}
      </span>
      <select
        className="focus-ring h-11 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.disabled}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorInput(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground/85">
        {props.label}
      </span>
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 rounded-xl border border-border/70 bg-white/70"
          style={{ background: props.value || "transparent" }}
          aria-hidden="true"
        />
        <input
          className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
          value={props.value}
          type="text"
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
          disabled={props.disabled}
        />
      </div>
    </label>
  );
}

function formatLeadValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return "";
}

function buildLeadDetails(lead: LeadEntry) {
  const payload = lead.payload as Record<string, unknown>;
  const details: Array<{ label: string; value: string }> = [];

  if (lead.type === "quote") {
    details.push(
      { label: "Kullanım alanı", value: formatLeadValue(payload.usageArea) },
      { label: "Ahşap türü", value: formatLeadValue(payload.woodType) },
      { label: "Kalınlık (mm)", value: formatLeadValue(payload.thicknessMm) },
      { label: "Kalite", value: formatLeadValue(payload.quality) },
      { label: "Boy (mm)", value: formatLeadValue(payload.lengthMm) },
      { label: "En (mm)", value: formatLeadValue(payload.widthMm) },
      { label: "Adet", value: formatLeadValue(payload.quantity) },
    );
  } else if (lead.type === "message") {
    details.push(
      { label: "Ad Soyad", value: formatLeadValue(payload.name) },
      { label: "Konu", value: formatLeadValue(payload.subject) },
      { label: "Mesaj", value: formatLeadValue(payload.message) },
    );
  } else if (lead.type === "quick") {
    details.push({ label: "Kaynak", value: formatLeadValue(payload.source) });
  }

  if (lead.notes) {
    details.push({ label: "Açıklama", value: lead.notes });
  }

  return details.filter((item) => item.value);
}

function Section(props: {
  id: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const isOpen = props.open ?? false;
  return (
    <section id={props.id} className="scroll-mt-24">
      <details
        open={isOpen}
        onToggle={(event) => props.onToggle?.(event.currentTarget.open)}
        className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur sm:p-8"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-display)] text-2xl">
            {props.title}
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-muted">
            {isOpen ? "Kapat" : "Aç"}
          </span>
        </summary>
        <div className="mt-6 grid gap-6">{props.children}</div>
      </details>
    </section>
  );
}

async function uploadImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Yükleme başarısız.");
  const json = (await res.json()) as { ok: true; src: string; thumb?: string };
  return { src: json.src, thumb: json.thumb };
}

const themeColorFields = [
  { key: "background", label: "Arkaplan" },
  { key: "surface", label: "Yüzey" },
  { key: "card", label: "Kart" },
  { key: "foreground", label: "Metin" },
  { key: "muted", label: "Soluk metin" },
  { key: "border", label: "Çerçeve" },
  { key: "accent", label: "Vurgu" },
  { key: "accentSoft", label: "Vurgu yumuşak" },
  { key: "woodBark", label: "Ahşap koyu" },
  { key: "woodCore", label: "Ahşap ana" },
  { key: "woodHalo", label: "Ahşap açık" },
  { key: "danger", label: "Uyarı" },
] as const;

const fontOptions = [
  { label: "Inter (varsayılan)", value: "var(--font-inter)" },
  { label: "Playfair Display", value: "var(--font-playfair)" },
  {
    label: "Sistem",
    value: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
] as const;

const themePresets = [
  {
    id: "warm-wood",
    name: "Sıcak Ahşap",
    description: "Doğal bejler ve bal rengi vurgular.",
    theme: {
      colors: {
        background: "#fdfbf7",
        foreground: "#1b160f",
        surface: "#fffdf8",
        card: "#f6f3ef",
        muted: "#7d6a53",
        border: "rgba(27, 22, 15, 0.15)",
        accent: "#c28637",
        accentSoft: "#f5d8b4",
        danger: "#c74333",
        woodBark: "#2c1d11",
        woodCore: "#8b5d37",
        woodHalo: "#dab386",
      },
      typography: {
        sans: "var(--font-inter)",
        display: "var(--font-playfair)",
      },
    },
  },
  {
    id: "sandstone",
    name: "Kumtaşı",
    description: "Sıcak kum tonları ve kiremit vurgular.",
    theme: {
      colors: {
        background: "#fbf6ef",
        foreground: "#2a1f18",
        surface: "#fff9f2",
        card: "#f2e6d7",
        muted: "#8a6f57",
        border: "rgba(42, 31, 24, 0.18)",
        accent: "#c46a3b",
        accentSoft: "#f2c7a6",
        danger: "#c4473a",
        woodBark: "#2f1f15",
        woodCore: "#86563a",
        woodHalo: "#ddb690",
      },
      typography: {
        sans: "var(--font-inter)",
        display: "var(--font-playfair)",
      },
    },
  },
  {
    id: "modern-slate",
    name: "Modern Slate",
    description: "Soğuk griler ve mavi vurgu.",
    theme: {
      colors: {
        background: "#f7f9fb",
        foreground: "#1a1f2b",
        surface: "#ffffff",
        card: "#eef2f6",
        muted: "#64748b",
        border: "rgba(26, 31, 43, 0.14)",
        accent: "#2b6cb0",
        accentSoft: "#cfe3ff",
        danger: "#d64545",
        woodBark: "#1f2937",
        woodCore: "#4b5d75",
        woodHalo: "#a7b6c9",
      },
      typography: {
        sans: "var(--font-inter)",
        display: "var(--font-playfair)",
      },
    },
  },
] as const;

const adminMenu = [
  { id: "brand", label: "Marka" },
  { id: "theme", label: "Tema" },
  { id: "hero", label: "Hero" },
  { id: "seo", label: "SEO" },
  { id: "mail", label: "Mail" },
  { id: "about", label: "Hakkımızda" },
  { id: "products", label: "Ürünler" },
  { id: "services", label: "Hizmetler" },
  { id: "service-area", label: "Harita" },
  { id: "trust", label: "Güven" },
  { id: "calculator", label: "Hesaplama" },
  { id: "gallery", label: "Galeri" },
  { id: "testimonials", label: "Yorumlar" },
  { id: "faq", label: "SSS" },
  { id: "leads", label: "Talepler" },
  { id: "footer", label: "Footer" },
] as const;

export function AdminApp() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [leads, setLeads] = useState<LeadEntry[] | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [mailSettings, setMailSettings] = useState<MailSettings | null>(null);
  const [mailStatus, setMailStatus] = useState<Status>({ kind: "loading" });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => Object.fromEntries(adminMenu.map((item) => [item.id, false])),
  );

  const setSectionOpen = useCallback((id: string, open: boolean) => {
    setOpenSections((s) => ({ ...s, [id]: open }));
  }, []);

  const openSection = useCallback((id: string) => {
    setOpenSections((s) => ({ ...s, [id]: true }));
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  const isSectionOpen = (id: string) => Boolean(openSections[id]);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    setLeadsError(null);
    try {
      const res = await fetch("/api/admin/leads", { cache: "no-store" });
      if (!res.ok) throw new Error("Talepler alınamadı.");
      const json = (await res.json()) as { ok: true; leads: LeadEntry[] };
      setLeads(json.leads);
    } catch (error) {
      setLeadsError(
        error instanceof Error ? error.message : "Talepler alınamadı.",
      );
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  async function deleteLeadById(id: string) {
    setDeletingLeadId(id);
    try {
      const res = await fetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Talep silinemedi.");
      await loadLeads();
    } catch (error) {
      setLeadsError(
        error instanceof Error ? error.message : "Talep silinemedi.",
      );
    } finally {
      setDeletingLeadId(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/content", { cache: "no-store" });
        if (!res.ok) throw new Error("İçerik alınamadı.");
        const json = (await res.json()) as { ok: true; content: SiteContent };
        if (!mounted) return;
        setContent(json.content);
        setStatus({ kind: "idle" });
      } catch (e) {
        if (!mounted) return;
        setStatus({
          kind: "error",
          message: e instanceof Error ? e.message : "Hata oluştu.",
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/mailbox", { cache: "no-store" });
        if (!res.ok) throw new Error("Mail ayarları alınamadı.");
        const json = (await res.json()) as {
          ok: true;
          settings: MailSettings;
        };
        if (!mounted) return;
        setMailSettings(json.settings);
        setMailStatus({ kind: "idle" });
      } catch (error) {
        if (!mounted) return;
        setMailStatus({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Mail ayarları alınamadı.",
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const previewHref = useMemo(() => "/", []);

  async function save() {
    if (!content) return;
    setStatus({ kind: "saving" });
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(content),
    });
    if (res.ok) {
      setStatus({ kind: "success", message: "Kaydedildi." });
      return;
    }
    const json = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    setStatus({
      kind: "error",
      message: json?.message || json?.error || "Kaydetme başarısız.",
    });
  }

  async function saveMailSettings() {
    if (!mailSettings) return;
    setMailStatus({ kind: "saving" });
    const res = await fetch("/api/admin/mailbox", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mailSettings),
    });
    if (res.ok) {
      setMailStatus({ kind: "success", message: "Mail ayarları kaydedildi." });
      return;
    }
    const json = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    setMailStatus({
      kind: "error",
      message: json?.message || json?.error || "Mail ayarları kaydedilemedi.",
    });
  }

  if (status.kind === "loading") {
    return <div className="text-sm text-muted">Yükleniyor…</div>;
  }

  if (status.kind === "error") {
    return (
      <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
        {status.message}
      </div>
    );
  }

  if (!content) return null;
  const brandLogoSrc = normalizeImageSrc(content.brand.logo);
  const heroImageSrc = normalizeImageSrc(content.hero.heroImage?.src);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm tracking-[0.22em] text-accent/80">YÖNETİM</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
            İçerik Paneli
          </h1>
          <p className="mt-2 text-sm text-foreground/75">
            Tüm metin/görselleri buradan güncelleyin.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <a
            className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-border/80 bg-card/60 px-6 text-sm hover:bg-card/80"
            href={previewHref}
            target="_blank"
            rel="noreferrer"
          >
            Siteyi aç
          </a>
          <button
            className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2 disabled:opacity-60"
            disabled={status.kind === "saving"}
            onClick={save}
          >
            {status.kind === "saving" ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>

      {status.kind === "success" ? (
        <div className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-sm">
          {status.message}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border/70 bg-card/50 p-5 backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Menü
          </p>
          <p className="text-xs text-muted">
            Bölüme gitmek için tıklayın.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {adminMenu.map((item) => (
            <button
              key={item.id}
              type="button"
              className="focus-ring rounded-full border border-border/80 bg-surface/60 px-4 py-2 text-xs hover:bg-surface/80"
              onClick={() => openSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Section
        id="brand"
        title="Marka & İletişim"
        open={isSectionOpen("brand")}
        onToggle={(open) => setSectionOpen("brand", open)}
      >
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/70">
              Firma logosu
            </p>
            {brandLogoSrc ? (
              <Image
                src={brandLogoSrc}
                alt={`${content.brand.name} logo`}
                width={220}
                height={88}
                className="h-20 w-auto object-contain"
                unoptimized={brandLogoSrc.endsWith(".svg")}
              />
            ) : (
              <div className="h-20 w-full rounded-xl bg-surface/70" />
            )}
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground/85">
                Görsel yükle
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setStatus({ kind: "saving" });
                    const { src } = await uploadImage(file);
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            brand: { ...s.brand, logo: src },
                          }
                        : s,
                    );
                    setStatus({
                      kind: "success",
                      message: "Logo yüklendi.",
                    });
                  } catch (err) {
                    setStatus({
                      kind: "error",
                      message:
                        err instanceof Error ? err.message : "Yükleme hatası.",
                    });
                  } finally {
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="focus-ring text-sm text-foreground underline"
              onClick={() =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, logo: undefined } } : s,
                )
              }
            >
              Logoyu kaldır
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput
              label="Logo yolu (ops.)"
              value={content.brand.logo ?? ""}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        brand: {
                          ...s.brand,
                          logo: v || undefined,
                        },
                      }
                    : s,
                )
              }
              placeholder="/uploads/logo.png"
            />
            <TextInput
              label="Firma adı"
              value={content.brand.name}
              onChange={(v) =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, name: v } } : s,
                )
              }
            />
            <TextInput
              label="Slogan"
              value={content.brand.tagline}
              onChange={(v) =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, tagline: v } } : s,
                )
              }
            />
            <TextInput
              label="Şehir"
              value={content.brand.city}
              onChange={(v) =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, city: v } } : s,
                )
              }
            />
            <TextInput
              label="Adres (ops.)"
              value={content.brand.address ?? ""}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        brand: { ...s.brand, address: v || undefined },
                      }
                    : s,
                )
              }
            />
            <TextInput
              label="Telefon"
              value={content.brand.phone}
              onChange={(v) =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, phone: v } } : s,
                )
              }
            />
            <TextInput
              label="E-posta"
              value={content.brand.email}
              onChange={(v) =>
                setContent((s) =>
                  s ? { ...s, brand: { ...s.brand, email: v } } : s,
                )
              }
              type="email"
            />
            <TextInput
              label="WhatsApp (ops.)"
              value={content.brand.whatsapp ?? ""}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        brand: { ...s.brand, whatsapp: v || undefined },
                      }
                    : s,
                )
              }
              placeholder="905XXXXXXXXX"
            />
            <TextInput
              label="Logo yüksekliği (px)"
              value={content.brand.logoHeight?.toString() ?? ""}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        brand: {
                          ...s.brand,
                          logoHeight: v ? Number(v) : undefined,
                        },
                      }
                    : s,
                )
              }
              type="number"
              placeholder="64"
            />
            <TextInput
              label="Logo max genişlik (px)"
              value={content.brand.logoMaxWidth?.toString() ?? ""}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        brand: {
                          ...s.brand,
                          logoMaxWidth: v ? Number(v) : undefined,
                        },
                      }
                    : s,
                )
              }
              type="number"
              placeholder="220"
            />
          </div>
        </div>
      </Section>

      <Section
        id="theme"
        title="Tema"
        open={isSectionOpen("theme")}
        onToggle={(open) => setSectionOpen("theme", open)}
      >
        <div className="grid gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Tema şablonları</p>
            <p className="text-xs text-muted">
              Şablon seçip kaydettiğinizde siteye uygulanır.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {themePresets.map((preset) => (
              <div
                key={preset.id}
                className="rounded-2xl border border-border/70 bg-surface/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-xs hover:bg-card/80"
                    onClick={() =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              theme: {
                                colors: { ...preset.theme.colors },
                                typography: { ...preset.theme.typography },
                              },
                            }
                          : s,
                      )
                    }
                  >
                    Uygula
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full border border-border/60"
                    style={{ background: preset.theme.colors.background }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-border/60"
                    style={{ background: preset.theme.colors.accent }}
                    aria-hidden="true"
                  />
                  <span
                    className="h-6 w-6 rounded-full border border-border/60"
                    style={{ background: preset.theme.colors.woodCore }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectInput
            label="Gövde yazı tipi"
            value={content.theme.typography.sans}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      theme: {
                        ...s.theme,
                        typography: { ...s.theme.typography, sans: v },
                      },
                    }
                  : s,
              )
            }
            options={fontOptions}
          />
          <SelectInput
            label="Başlık yazı tipi"
            value={content.theme.typography.display}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      theme: {
                        ...s.theme,
                        typography: { ...s.theme.typography, display: v },
                      },
                    }
                  : s,
              )
            }
            options={fontOptions}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {themeColorFields.map((field) => (
            <ColorInput
              key={field.key}
              label={field.label}
              value={content.theme.colors[field.key]}
              onChange={(v) =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        theme: {
                          ...s.theme,
                          colors: {
                            ...s.theme.colors,
                            [field.key]: v,
                          },
                        },
                      }
                    : s,
                )
              }
              placeholder="Örn: #fdfbf7 veya rgba(0,0,0,0.2)"
            />
          ))}
        </div>
      </Section>

      <Section
        id="hero"
        title="Hero"
        open={isSectionOpen("hero")}
        onToggle={(open) => setSectionOpen("hero", open)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Üst başlık"
            value={content.hero.eyebrow}
            onChange={(v) =>
              setContent((s) => (s ? { ...s, hero: { ...s.hero, eyebrow: v } } : s))
            }
          />
          <TextInput
            label="Başlık"
            value={content.hero.headline}
            onChange={(v) =>
              setContent((s) => (s ? { ...s, hero: { ...s.hero, headline: v } } : s))
            }
          />
          <Textarea
            label="Açıklama"
            value={content.hero.subhead}
            onChange={(v) =>
              setContent((s) => (s ? { ...s, hero: { ...s.hero, subhead: v } } : s))
            }
          />
          <Textarea
            label="Alt not"
            value={content.hero.note}
            onChange={(v) =>
              setContent((s) => (s ? { ...s, hero: { ...s.hero, note: v } } : s))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="CTA 1 etiket"
            value={content.hero.ctaPrimaryLabel}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, hero: { ...s.hero, ctaPrimaryLabel: v } } : s,
              )
            }
          />
          <TextInput
            label="CTA 1 link"
            value={content.hero.ctaPrimaryHref}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, hero: { ...s.hero, ctaPrimaryHref: v } } : s,
              )
            }
          />
          <TextInput
            label="CTA 2 etiket"
            value={content.hero.ctaSecondaryLabel}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, hero: { ...s.hero, ctaSecondaryLabel: v } } : s,
              )
            }
          />
          <TextInput
            label="CTA 2 link"
            value={content.hero.ctaSecondaryHref}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, hero: { ...s.hero, ctaSecondaryHref: v } } : s,
              )
            }
          />
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Öne çıkanlar</p>
            <button
              type="button"
              className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
              onClick={() =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        hero: {
                          ...s.hero,
                          highlights: [
                            ...s.hero.highlights,
                            { title: "Başlık", value: "Değer" },
                          ],
                        },
                      }
                    : s,
                )
              }
            >
              Ekle
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {content.hero.highlights.map((h, idx) => (
              <div
                key={`${h.title}-${idx}`}
                className="rounded-2xl border border-border/70 bg-surface/40 p-4"
              >
                <div className="grid gap-3">
                  <TextInput
                    label="Başlık"
                    value={h.title}
                    onChange={(v) =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              hero: {
                                ...s.hero,
                                highlights: s.hero.highlights.map((x, i) =>
                                  i === idx ? { ...x, title: v } : x,
                                ),
                              },
                            }
                          : s,
                      )
                    }
                  />
                  <TextInput
                    label="Değer"
                    value={h.value}
                    onChange={(v) =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              hero: {
                                ...s.hero,
                                highlights: s.hero.highlights.map((x, i) =>
                                  i === idx ? { ...x, value: v } : x,
                                ),
                              },
                            }
                          : s,
                      )
                    }
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                      onClick={() =>
                        setContent((s) =>
                          s
                            ? {
                                ...s,
                                hero: {
                                  ...s.hero,
                                  highlights: s.hero.highlights.filter(
                                    (_, i) => i !== idx,
                                  ),
                                },
                              }
                            : s,
                        )
                      }
                    >
                      Sil
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="focus-ring rounded-full border border-border/80 bg-card/60 px-3 py-2 text-sm hover:bg-card/80 disabled:opacity-50"
                        disabled={idx === 0}
                        onClick={() =>
                          setContent((s) => {
                            if (!s) return s;
                            const next = [...s.hero.highlights];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            return { ...s, hero: { ...s.hero, highlights: next } };
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="focus-ring rounded-full border border-border/80 bg-card/60 px-3 py-2 text-sm hover:bg-card/80 disabled:opacity-50"
                        disabled={idx === content.hero.highlights.length - 1}
                        onClick={() =>
                          setContent((s) => {
                            if (!s) return s;
                            const next = [...s.hero.highlights];
                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                            return { ...s, hero: { ...s.hero, highlights: next } };
                          })
                        }
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Hero görseli</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:items-start">
            <div className="rounded-2xl border border-border/70 bg-surface/40 p-3">
              {heroImageSrc ? (
                <Image
                  src={heroImageSrc}
                  alt={content.hero.heroImage?.alt ?? ""}
                  width={1200}
                  height={800}
                  className="h-56 w-full rounded-xl object-cover"
                  unoptimized={heroImageSrc.endsWith(".svg")}
                />
              ) : (
                <div className="h-56 rounded-xl bg-surface/60" />
              )}
            </div>
            <div className="grid gap-3">
              <TextInput
                label="Görsel yolu"
                value={content.hero.heroImage?.src ?? ""}
                onChange={(v) =>
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          hero: {
                            ...s.hero,
                            heroImage: {
                              src: v,
                              alt: s.hero.heroImage?.alt ?? "Hero görseli",
                              thumb: s.hero.heroImage?.thumb,
                            },
                          },
                        }
                      : s,
                  )
                }
                placeholder="/uploads/..."
              />
              <TextInput
                label="Alt metin"
                value={content.hero.heroImage?.alt ?? ""}
                onChange={(v) =>
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          hero: {
                            ...s.hero,
                            heroImage: {
                              src: s.hero.heroImage?.src ?? "",
                              alt: v,
                            },
                          },
                        }
                      : s,
                  )
                }
              />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground/85">
                  Yükle
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setStatus({ kind: "saving" });
                      const { src, thumb } = await uploadImage(file);
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              hero: {
                                ...s.hero,
                                heroImage: {
                                  src,
                                  alt: file.name || "Hero",
                                  thumb,
                                },
                              },
                            }
                          : s,
                      );
                      setStatus({ kind: "success", message: "Yüklendi." });
                    } catch (err) {
                      setStatus({
                        kind: "error",
                        message:
                          err instanceof Error ? err.message : "Yükleme hatası.",
                      });
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
        </div>
      </div>
      <div className="grid gap-4">
          <TextInput
            label="Video URL (embed)"
            value={content.hero.heroVideo?.url ?? ""}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      hero: {
                        ...s.hero,
                        heroVideo: v
                          ? {
                              url: v,
                              title: s.hero.heroVideo?.title,
                              description: s.hero.heroVideo?.description,
                            }
                          : undefined,
                      },
                    }
                  : s,
              )
            }
            placeholder="https://www.youtube.com/embed/..."
          />
          <TextInput
            label="Video başlığı (ops.)"
            value={content.hero.heroVideo?.title ?? ""}
            disabled={!content.hero.heroVideo?.url}
            onChange={(v) =>
              setContent((s) =>
                s?.hero.heroVideo
                  ? {
                      ...s,
                      hero: {
                        ...s.hero,
                        heroVideo: {
                          ...s.hero.heroVideo,
                          title: v || undefined,
                        },
                      },
                    }
                  : s,
              )
            }
          />
          <Textarea
            label="Video açıklaması (ops.)"
            value={content.hero.heroVideo?.description ?? ""}
            disabled={!content.hero.heroVideo?.url}
            onChange={(v) =>
              setContent((s) =>
                s?.hero.heroVideo
                  ? {
                      ...s,
                      hero: {
                        ...s.hero,
                        heroVideo: {
                          ...s.hero.heroVideo,
                          description: v || undefined,
                        },
                      },
                    }
                  : s,
              )
            }
        />
      </div>
      <div className="grid gap-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Hero hızlı seçenekler</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80 disabled:opacity-50"
            disabled={content.hero.quickOptions.length >= 6}
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      hero: {
                        ...s.hero,
                        quickOptions: [
                          ...s.hero.quickOptions,
                          {
                            label: "Yeni alan",
                            placeholder: "Seçim yap",
                            options: ["Seçenek"],
                          },
                        ],
                      },
                    }
                  : s,
              )
            }
          >
            Yeni alan
          </button>
        </div>
        <div className="grid gap-4">
          {content.hero.quickOptions.map((option, idx) => (
            <div
              key={`${option.label}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput
                  label="Etiket"
                  value={option.label}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            hero: {
                              ...s.hero,
                              quickOptions: s.hero.quickOptions.map((x, i) =>
                                i === idx ? { ...x, label: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <TextInput
                  label="Placeholder"
                  value={option.placeholder ?? ""}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            hero: {
                              ...s.hero,
                              quickOptions: s.hero.quickOptions.map((x, i) =>
                                i === idx ? { ...x, placeholder: v || undefined } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
              </div>
              <Textarea
                label="Not (ops.)"
                value={option.note ?? ""}
                onChange={(v) =>
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          hero: {
                            ...s.hero,
                            quickOptions: s.hero.quickOptions.map((x, i) =>
                              i === idx ? { ...x, note: v || undefined } : x,
                            ),
                          },
                        }
                      : s,
                  )
                }
              />
              <Textarea
                label="Seçenekler (her satır)"
                value={option.options.join("\n")}
                onChange={(v) => {
                  const parsed = v
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);
                  const nextOptions = parsed.length ? parsed : option.options;
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          hero: {
                            ...s.hero,
                            quickOptions: s.hero.quickOptions.map((x, i) =>
                              i === idx ? { ...x, options: nextOptions } : x,
                            ),
                          },
                        }
                      : s,
                  );
                }}
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border/80 bg-card/60 px-3 py-2 text-sm hover:bg-card/80 disabled:opacity-50"
                    disabled={idx === 0}
                    onClick={() =>
                      setContent((s) => {
                        if (!s) return s;
                        const next = [...s.hero.quickOptions];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        return { ...s, hero: { ...s.hero, quickOptions: next } };
                      })
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-border/80 bg-card/60 px-3 py-2 text-sm hover:bg-card/80 disabled:opacity-50"
                    disabled={idx === content.hero.quickOptions.length - 1}
                    onClick={() =>
                      setContent((s) => {
                        if (!s) return s;
                        const next = [...s.hero.quickOptions];
                        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                        return { ...s, hero: { ...s.hero, quickOptions: next } };
                      })
                    }
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            hero: {
                              ...s.hero,
                              quickOptions: s.hero.quickOptions.filter(
                                (_, i) => i !== idx,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>

      <Section
        id="seo"
        title="SEO"
        open={isSectionOpen("seo")}
        onToggle={(open) => setSectionOpen("seo", open)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="SEO başlık"
            value={content.seo.title}
            onChange={(v) =>
              setContent((s) => (s ? { ...s, seo: { ...s.seo, title: v } } : s))
            }
          />
          <TextInput
            label="OG görsel yolu (ops.)"
            value={content.seo.ogImage ?? ""}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, seo: { ...s.seo, ogImage: v || undefined } } : s,
              )
            }
            placeholder="/uploads/..."
          />
          <TextInput
            label="Google doğrulama meta"
            value={content.seo.googleSiteVerification ?? ""}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      seo: {
                        ...s.seo,
                        googleSiteVerification: v || undefined,
                      },
                    }
                  : s,
              )
            }
            placeholder="Meta kodu (ör: abc123...)"
          />
          <TextInput
            label="GA ölçüm ID"
            value={content.seo.gaMeasurementId ?? ""}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      seo: { ...s.seo, gaMeasurementId: v || undefined },
                    }
                  : s,
              )
            }
            placeholder="G-XXXXXXX"
          />
        </div>
        <Textarea
          label="SEO açıklama"
          value={content.seo.description}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, seo: { ...s.seo, description: v } } : s,
            )
          }
        />
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Anahtar kelimeler</p>
            <button
              type="button"
              className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
              onClick={() =>
                setContent((s) =>
                  s
                    ? { ...s, seo: { ...s.seo, keywords: [...s.seo.keywords, ""] } }
                    : s,
                )
              }
            >
              Ekle
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.seo.keywords.map((k, idx) => (
              <div key={`${k}-${idx}`} className="flex gap-2">
                <input
                  className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
                  value={k}
                  placeholder="örn: masif panel"
                  onChange={(e) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            seo: {
                              ...s.seo,
                              keywords: s.seo.keywords.map((x, i) =>
                                i === idx ? e.target.value : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring h-11 rounded-xl border border-danger/25 bg-danger/10 px-3 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            seo: {
                              ...s.seo,
                              keywords: s.seo.keywords.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="mail"
        title="Mail ayarları"
        open={isSectionOpen("mail")}
        onToggle={(open) => setSectionOpen("mail", open)}
      >
        {!mailSettings ? (
          mailStatus.kind === "error" ? (
            <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
              {mailStatus.message}
            </div>
          ) : (
            <p className="text-sm text-muted">Yükleniyor…</p>
          )
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="SMTP host"
                value={mailSettings.smtpHost}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, smtpHost: v } : s))
                }
                placeholder="smtp.example.com"
              />
              <TextInput
                label="SMTP port"
                value={mailSettings.smtpPort}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, smtpPort: v } : s))
                }
                placeholder="587"
              />
              <TextInput
                label="SMTP kullanıcı"
                value={mailSettings.smtpUser}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, smtpUser: v } : s))
                }
                placeholder="user@example.com"
              />
              <TextInput
                label="SMTP şifre"
                value={mailSettings.smtpPass}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, smtpPass: v } : s))
                }
                type="password"
                placeholder="••••••••"
              />
              <TextInput
                label="Gönderen adres (From)"
                value={mailSettings.mailFrom}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, mailFrom: v } : s))
                }
                placeholder="noreply@example.com"
              />
              <TextInput
                label="Alıcı adres (To)"
                value={mailSettings.mailTo}
                onChange={(v) =>
                  setMailSettings((s) => (s ? { ...s, mailTo: v } : s))
                }
                placeholder="teklif@example.com"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-foreground/80">
              <input
                type="checkbox"
                checked={mailSettings.smtpSecure}
                onChange={(e) =>
                  setMailSettings((s) =>
                    s ? { ...s, smtpSecure: e.target.checked } : s,
                  )
                }
                className="focus-ring h-4 w-4 rounded border border-border/80 bg-surface/60"
              />
              SMTP Secure (TLS/SSL) kullan
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Not: Ayarları kaydettikten sonra yeni talepler bu adrese düşer.
              </p>
              <button
                type="button"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2 disabled:opacity-60"
                disabled={mailStatus.kind === "saving"}
                onClick={saveMailSettings}
              >
                {mailStatus.kind === "saving" ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
            {mailStatus.kind === "success" ? (
              <div className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-sm">
                {mailStatus.message}
              </div>
            ) : null}
            {mailStatus.kind === "error" ? (
              <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
                {mailStatus.message}
              </div>
            ) : null}
          </>
        )}
      </Section>

      <Section
        id="about"
        title="Hakkımızda"
        open={isSectionOpen("about")}
        onToggle={(open) => setSectionOpen("about", open)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Başlık"
            value={content.about.heading}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, about: { ...s.about, heading: v } } : s,
              )
            }
          />
        <TextInput
          label="Görsel yolu (ops.)"
          value={content.about.image?.src ?? ""}
          onChange={(v) =>
            setContent((s) =>
              s
                ? {
                    ...s,
                    about: {
                      ...s.about,
                      image: {
                        src: v,
                        alt: s.about.image?.alt ?? "Hakkımızda",
                        thumb: s.about.image?.thumb,
                      },
                    },
                  }
                : s,
            )
          }
            placeholder="/uploads/..."
          />
        </div>
        <Textarea
          label="Metin"
          value={content.about.text}
          onChange={(v) =>
            setContent((s) => (s ? { ...s, about: { ...s.about, text: v } } : s))
          }
        />
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Maddeler</p>
            <button
              type="button"
              className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
              onClick={() =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        about: { ...s.about, bullets: [...s.about.bullets, ""] },
                      }
                    : s,
                )
              }
            >
              Ekle
            </button>
          </div>
          <div className="grid gap-3">
            {content.about.bullets.map((b, idx) => (
              <div key={`${b}-${idx}`} className="flex gap-2">
                <input
                  className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
                  value={b}
                  placeholder="Madde"
                  onChange={(e) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            about: {
                              ...s.about,
                              bullets: s.about.bullets.map((x, i) =>
                                i === idx ? e.target.value : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring h-11 rounded-xl border border-danger/25 bg-danger/10 px-3 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            about: {
                              ...s.about,
                              bullets: s.about.bullets.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground/85">
            Hakkımızda görsel yükle (ops.)
          </span>
          <input
            type="file"
            accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setStatus({ kind: "saving" });
                  const { src, thumb } = await uploadImage(file);
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          about: {
                            ...s.about,
                            image: {
                              src,
                              alt: file.name || "Hakkımızda",
                              thumb,
                            },
                          },
                        }
                      : s,
                  );
                  setStatus({ kind: "success", message: "Yüklendi." });
                } catch (err) {
                  setStatus({
                    kind: "error",
                    message:
                      err instanceof Error ? err.message : "Yükleme hatası.",
                  });
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
      </Section>

      <Section
        id="products"
        title="Ürün kartları"
        open={isSectionOpen("products")}
        onToggle={(open) => setSectionOpen("products", open)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Başlık"
            value={content.products.heading}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, products: { ...s.products, heading: v } } : s,
              )
            }
          />
        </div>
        <Textarea
          label="Giriş metni"
          value={content.products.intro}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, products: { ...s.products, intro: v } } : s,
            )
          }
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Kartlar</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      products: {
                        ...s.products,
                        cards: [
                          ...s.products.cards,
                          { title: "Yeni ürün", desc: "Açıklama", image: undefined },
                        ],
                      },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.products.cards.map((c, idx) => (
            <div
              key={`${c.title}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <TextInput
                  label="Başlık"
                  value={c.title}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            products: {
                              ...s.products,
                              cards: s.products.cards.map((x, i) =>
                                i === idx ? { ...x, title: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <Textarea
                  label="Açıklama"
                  value={c.desc}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            products: {
                              ...s.products,
                              cards: s.products.cards.map((x, i) =>
                                i === idx ? { ...x, desc: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <Textarea
                  label="Detay metni (ops.)"
                  value={c.details ?? ""}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            products: {
                              ...s.products,
                              cards: s.products.cards.map((x, i) =>
                                i === idx ? { ...x, details: v || undefined } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <TextInput
                  label="Görsel yolu (ops.)"
                  value={c.image?.src ?? ""}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            products: {
                              ...s.products,
                                cards: s.products.cards.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        image: v
                                          ? {
                                              src: v,
                                              alt: x.image?.alt ?? x.title,
                                              thumb: x.image?.thumb,
                                            }
                                          : undefined,
                                      }
                                    : x,
                                ),
                            },
                          }
                        : s,
                    )
                  }
                  placeholder="/uploads/..."
                />
                <div className="flex items-center justify-between">
                  <label className="text-sm">
                    <span className="mr-3 text-sm font-medium text-foreground/85">
                      Yükle
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                          try {
                            setStatus({ kind: "saving" });
                            const { src, thumb } = await uploadImage(file);
                            setContent((s) =>
                              s
                                ? {
                                    ...s,
                                    products: {
                                      ...s.products,
                                      cards: s.products.cards.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              image: {
                                                src,
                                                alt: file.name || x.title,
                                                thumb,
                                              },
                                            }
                                          : x,
                                      ),
                                    },
                                  }
                                : s,
                            );
                            setStatus({ kind: "success", message: "Yüklendi." });
                          } catch (err) {
                            setStatus({
                              kind: "error",
                              message:
                                err instanceof Error
                                  ? err.message
                                  : "Yükleme hatası.",
                            });
                          } finally {
                            e.target.value = "";
                          }
                        }}
                    />
                  </label>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                    onClick={() =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              products: {
                                ...s.products,
                                cards: s.products.cards.filter((_, i) => i !== idx),
                              },
                            }
                          : s,
                      )
                    }
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="services"
        title="Hizmetler"
        open={isSectionOpen("services")}
        onToggle={(open) => setSectionOpen("services", open)}
      >
        <TextInput
          label="Başlık"
          value={content.services.heading}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, services: { ...s.services, heading: v } } : s,
            )
          }
        />
        <Textarea
          label="Giriş metni"
          value={content.services.intro}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, services: { ...s.services, intro: v } } : s,
            )
          }
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Adımlar</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      services: {
                        ...s.services,
                        steps: [
                          ...s.services.steps,
                          { key: "X", title: "Yeni adım", desc: "Açıklama" },
                        ],
                      },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.services.steps.map((st, idx) => (
            <div
              key={`${st.key}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextInput
                    label="No"
                    value={st.key}
                    onChange={(v) =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              services: {
                                ...s.services,
                                steps: s.services.steps.map((x, i) =>
                                  i === idx ? { ...x, key: v } : x,
                                ),
                              },
                            }
                          : s,
                      )
                    }
                  />
                  <div className="sm:col-span-2">
                    <TextInput
                      label="Başlık"
                      value={st.title}
                      onChange={(v) =>
                        setContent((s) =>
                          s
                            ? {
                                ...s,
                                services: {
                                  ...s.services,
                                  steps: s.services.steps.map((x, i) =>
                                    i === idx ? { ...x, title: v } : x,
                                  ),
                                },
                              }
                            : s,
                        )
                      }
                    />
                  </div>
                </div>
                <Textarea
                  label="Açıklama"
                  value={st.desc}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            services: {
                              ...s.services,
                              steps: s.services.steps.map((x, i) =>
                                i === idx ? { ...x, desc: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            services: {
                              ...s.services,
                              steps: s.services.steps.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="service-area"
        title="Servis bölgesi"
        open={isSectionOpen("service-area")}
        onToggle={(open) => setSectionOpen("service-area", open)}
      >
        <TextInput
          label="Başlık"
          value={content.serviceArea.heading}
          onChange={(v) =>
            setContent((s) =>
              s
                ? {
                    ...s,
                    serviceArea: { ...s.serviceArea, heading: v },
                  }
                : s,
            )
          }
        />
        <Textarea
          label="Tanım"
          value={content.serviceArea.intro}
          onChange={(v) =>
            setContent((s) =>
              s
                ? {
                    ...s,
                    serviceArea: { ...s.serviceArea, intro: v },
                  }
                : s,
            )
          }
        />
        <TextInput
          label="Harita embed URL"
          value={content.serviceArea.mapEmbedUrl}
          onChange={(v) =>
            setContent((s) =>
              s
                ? {
                    ...s,
                    serviceArea: { ...s.serviceArea, mapEmbedUrl: v },
                  }
                : s,
            )
          }
          placeholder="https://www.google.com/maps?..."
        />
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Bölgeler</p>
            <button
              type="button"
              className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
              onClick={() =>
                setContent((s) =>
                  s
                    ? {
                        ...s,
                        serviceArea: {
                          ...s.serviceArea,
                          areas: [...s.serviceArea.areas, "Yeni bölge"],
                        },
                      }
                    : s,
                )
              }
            >
              Ekle
            </button>
          </div>
          <div className="grid gap-2">
            {content.serviceArea.areas.map((area, idx) => (
              <div key={`${area}-${idx}`} className="flex gap-2">
                <input
                  className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
                  value={area}
                  onChange={(e) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            serviceArea: {
                              ...s.serviceArea,
                              areas: s.serviceArea.areas.map((x, i) =>
                                i === idx ? e.target.value : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring h-11 rounded-xl border border-danger/25 bg-danger/10 px-3 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            serviceArea: {
                              ...s.serviceArea,
                              areas: s.serviceArea.areas.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="trust"
        title="Güven & referans"
        open={isSectionOpen("trust")}
        onToggle={(open) => setSectionOpen("trust", open)}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{content.trust.heading}</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      trust: {
                        ...s.trust,
                        items: [
                          ...s.trust.items,
                          { title: "Yeni başlık", text: "Detay..." },
                        ],
                      },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.trust.items.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <TextInput
                  label="Başlık"
                  value={item.title}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            trust: {
                              ...s.trust,
                              items: s.trust.items.map((x, i) =>
                                i === idx ? { ...x, title: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <Textarea
                  label="Metin"
                  value={item.text}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            trust: {
                              ...s.trust,
                              items: s.trust.items.map((x, i) =>
                                i === idx ? { ...x, text: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            trust: {
                              ...s.trust,
                              items: s.trust.items.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="calculator"
        title="Hesaplama aracı"
        open={isSectionOpen("calculator")}
        onToggle={(open) => setSectionOpen("calculator", open)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Kalınlık varsayılan (mm)"
            value={String(content.calculator.thicknessDefaultMm)}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      calculator: {
                        ...s.calculator,
                        thicknessDefaultMm: Number(v || 0),
                      },
                    }
                  : s,
              )
            }
          />
          <TextInput
            label="Kalınlık min (mm)"
            value={String(content.calculator.thicknessMinMm)}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      calculator: { ...s.calculator, thicknessMinMm: Number(v || 0) },
                    }
                  : s,
              )
            }
          />
          <TextInput
            label="Kalınlık max (mm)"
            value={String(content.calculator.thicknessMaxMm)}
            onChange={(v) =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      calculator: { ...s.calculator, thicknessMaxMm: Number(v || 0) },
                    }
                  : s,
              )
            }
            />
          <Textarea
            label="Kalınlık seçenekleri (mm) (her satır)"
            value={content.calculator.thicknessOptions.join("\n")}
            onChange={(v) => {
              const parsed = v
                .split("\n")
                .map((line) => Number(line.trim()))
                .filter((n) => Number.isFinite(n));
              const nextOptions = parsed.length
                ? parsed.map((n) => Math.trunc(n))
                : content.calculator.thicknessOptions;
              setContent((s) =>
                s
                  ? {
                      ...s,
                      calculator: {
                        ...s.calculator,
                        thicknessOptions: nextOptions,
                      },
                    }
                  : s,
              );
            }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Kullanım alanları</p>
              <button
                type="button"
                className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
                onClick={() =>
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          calculator: {
                            ...s.calculator,
                            usageAreas: [...s.calculator.usageAreas, ""],
                          },
                        }
                      : s,
                  )
                }
              >
                Ekle
              </button>
            </div>
            {content.calculator.usageAreas.map((x, idx) => (
              <div key={`${x}-${idx}`} className="flex gap-2">
                <input
                  className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
                  value={x}
                  onChange={(e) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            calculator: {
                              ...s.calculator,
                              usageAreas: s.calculator.usageAreas.map((v, i) =>
                                i === idx ? e.target.value : v,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring h-11 rounded-xl border border-danger/25 bg-danger/10 px-3 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            calculator: {
                              ...s.calculator,
                              usageAreas: s.calculator.usageAreas.filter(
                                (_, i) => i !== idx,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Ahşap türleri</p>
              <button
                type="button"
                className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
                onClick={() =>
                  setContent((s) =>
                    s
                      ? {
                          ...s,
                          calculator: {
                            ...s.calculator,
                            woodTypes: [...s.calculator.woodTypes, ""],
                          },
                        }
                      : s,
                  )
                }
              >
                Ekle
              </button>
            </div>
            {content.calculator.woodTypes.map((x, idx) => (
              <div key={`${x}-${idx}`} className="flex gap-2">
                <input
                  className="focus-ring h-11 flex-1 rounded-xl border border-border/80 bg-surface/60 px-3 text-sm"
                  value={x}
                  onChange={(e) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            calculator: {
                              ...s.calculator,
                              woodTypes: s.calculator.woodTypes.map((v, i) =>
                                i === idx ? e.target.value : v,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring h-11 rounded-xl border border-danger/25 bg-danger/10 px-3 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            calculator: {
                              ...s.calculator,
                              woodTypes: s.calculator.woodTypes.filter(
                                (_, i) => i !== idx,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section
        id="gallery"
        title="Galeri"
        open={isSectionOpen("gallery")}
        onToggle={(open) => setSectionOpen("gallery", open)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Başlık"
            value={content.gallery.heading}
            onChange={(v) =>
              setContent((s) =>
                s ? { ...s, gallery: { ...s.gallery, heading: v } } : s,
              )
            }
          />
        </div>
        <Textarea
          label="Giriş"
          value={content.gallery.intro}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, gallery: { ...s.gallery, intro: v } } : s,
            )
          }
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Görseller</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      gallery: {
                        ...s.gallery,
                        images: [...s.gallery.images, { src: "", alt: "Galeri" }],
                      },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.gallery.images.map((img, idx) => (
            <div
              key={`${img.src}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <TextInput
                  label="Görsel yolu"
                  value={img.src}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            gallery: {
                              ...s.gallery,
                              images: s.gallery.images.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      src: v,
                                      thumb: x.thumb,
                                    }
                                  : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                  placeholder="/uploads/..."
                />
                <TextInput
                  label="Alt metin"
                  value={img.alt}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            gallery: {
                              ...s.gallery,
                              images: s.gallery.images.map((x, i) =>
                                i === idx ? { ...x, alt: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <div className="flex items-center justify-between">
                  <label className="text-sm">
                        <span className="mr-3 text-sm font-medium text-foreground/85">
                          Yükle
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setStatus({ kind: "saving" });
                              const { src, thumb } = await uploadImage(file);
                              setContent((s) =>
                                s
                                  ? {
                                      ...s,
                                      gallery: {
                                        ...s.gallery,
                                        images: s.gallery.images.map((x, i) =>
                                          i === idx
                                            ? {
                                                ...x,
                                                src,
                                                alt: x.alt || file.name,
                                                thumb,
                                              }
                                            : x,
                                        ),
                                      },
                                    }
                                  : s,
                              );
                              setStatus({ kind: "success", message: "Yüklendi." });
                            } catch (err) {
                              setStatus({
                                kind: "error",
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : "Yükleme hatası.",
                              });
                            } finally {
                              e.target.value = "";
                            }
                          }}
                        />
                  </label>
                  <button
                    type="button"
                    className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                    onClick={() =>
                      setContent((s) =>
                        s
                          ? {
                              ...s,
                              gallery: {
                                ...s.gallery,
                                images: s.gallery.images.filter((_, i) => i !== idx),
                              },
                            }
                          : s,
                      )
                    }
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="testimonials"
        title="Müşteri yorumları"
        open={isSectionOpen("testimonials")}
        onToggle={(open) => setSectionOpen("testimonials", open)}
      >
        <TextInput
          label="Başlık"
          value={content.testimonials.heading}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, testimonials: { ...s.testimonials, heading: v } } : s,
            )
          }
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Yorumlar</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      testimonials: {
                        ...s.testimonials,
                        items: [
                          ...s.testimonials.items,
                          { name: "İsim", title: "Proje", text: "Yorum..." },
                        ],
                      },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {content.testimonials.items.map((t, idx) => (
            <div
              key={`${t.name}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <TextInput
                  label="İsim"
                  value={t.name}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            testimonials: {
                              ...s.testimonials,
                              items: s.testimonials.items.map((x, i) =>
                                i === idx ? { ...x, name: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <TextInput
                  label="Başlık (ops.)"
                  value={t.title ?? ""}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            testimonials: {
                              ...s.testimonials,
                              items: s.testimonials.items.map((x, i) =>
                                i === idx ? { ...x, title: v || undefined } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <Textarea
                  label="Yorum"
                  value={t.text}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            testimonials: {
                              ...s.testimonials,
                              items: s.testimonials.items.map((x, i) =>
                                i === idx ? { ...x, text: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            testimonials: {
                              ...s.testimonials,
                              items: s.testimonials.items.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="faq"
        title="SSS"
        open={isSectionOpen("faq")}
        onToggle={(open) => setSectionOpen("faq", open)}
      >
        <TextInput
          label="Başlık"
          value={content.faq.heading}
          onChange={(v) =>
            setContent((s) => (s ? { ...s, faq: { ...s.faq, heading: v } } : s))
          }
        />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Sorular</p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() =>
              setContent((s) =>
                s
                  ? {
                      ...s,
                      faq: { ...s.faq, items: [...s.faq.items, { q: "", a: "" }] },
                    }
                  : s,
              )
            }
          >
            Ekle
          </button>
        </div>
        <div className="grid gap-4">
          {content.faq.items.map((it, idx) => (
            <div
              key={`${it.q}-${idx}`}
              className="rounded-2xl border border-border/70 bg-surface/40 p-4"
            >
              <div className="grid gap-3">
                <TextInput
                  label="Soru"
                  value={it.q}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            faq: {
                              ...s.faq,
                              items: s.faq.items.map((x, i) =>
                                i === idx ? { ...x, q: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <Textarea
                  label="Cevap"
                  value={it.a}
                  onChange={(v) =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            faq: {
                              ...s.faq,
                              items: s.faq.items.map((x, i) =>
                                i === idx ? { ...x, a: v } : x,
                              ),
                            },
                          }
                        : s,
                    )
                  }
                />
                <button
                  type="button"
                  className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-4 py-2 text-sm"
                  onClick={() =>
                    setContent((s) =>
                      s
                        ? {
                            ...s,
                            faq: {
                              ...s.faq,
                              items: s.faq.items.filter((_, i) => i !== idx),
                            },
                          }
                        : s,
                    )
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="leads"
        title="Gelen talepler"
        open={isSectionOpen("leads")}
        onToggle={(open) => setSectionOpen("leads", open)}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Kayıtlı: {leads?.length ?? 0}
          </p>
          <button
            type="button"
            className="focus-ring rounded-full border border-border/80 bg-card/60 px-4 py-2 text-sm hover:bg-card/80"
            onClick={() => {
              loadLeads();
            }}
          >
            Yenile
          </button>
        </div>
        {leadsLoading ? (
          <p className="text-sm text-muted">Yükleniyor…</p>
        ) : leadsError ? (
          <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
            {leadsError}
          </div>
        ) : leads && leads.length > 0 ? (
          <div className="grid gap-3">
            {leads.map((lead) => {
              const details = buildLeadDetails(lead);
              return (
                <div
                  key={lead.id}
                  className="rounded-3xl border border-border/70 bg-card/50 p-4 text-sm"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">
                      {lead.type}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(lead.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{lead.email}</p>
                      <p className="text-xs text-foreground/70">{lead.phone}</p>
                    </div>
                    <button
                      type="button"
                      className="focus-ring rounded-full border border-danger/25 bg-danger/10 px-3 py-1 text-xs"
                      onClick={() => deleteLeadById(lead.id)}
                      disabled={deletingLeadId === lead.id}
                    >
                      {deletingLeadId === lead.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                  {details.length ? (
                    <div className="mt-2 grid gap-1 text-xs text-foreground/70">
                      {details.map((item) => (
                        <p key={item.label}>
                          <span className="text-muted">{item.label}: </span>
                          {item.value}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-xs text-foreground/60">
                      {JSON.stringify(lead.payload, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">Henüz talep bulunamadı.</p>
        )}
      </Section>

      <Section
        id="footer"
        title="Footer"
        open={isSectionOpen("footer")}
        onToggle={(open) => setSectionOpen("footer", open)}
      >
        <Textarea
          label="Kısa açıklama"
          value={content.footer.blurb}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, footer: { ...s.footer, blurb: v } } : s,
            )
          }
        />
        <TextInput
          label="Alt bilgi (ops.)"
          value={content.footer.fineprint ?? ""}
          onChange={(v) =>
            setContent((s) =>
              s ? { ...s, footer: { ...s.footer, fineprint: v || undefined } } : s,
            )
          }
          placeholder="Mobil uyumlu • Hızlı • SEO uyumlu"
        />
      </Section>
    </div>
  );
}
