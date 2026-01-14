"use client";

import Link from "next/link";
import { forwardRef, useMemo, useRef, useState } from "react";

type CalculatorConfig = {
  usageAreas: string[];
  woodTypes: string[];
  thicknessOptions: number[];
  thicknessDefaultMm: number;
  thicknessMinMm: number;
  thicknessMaxMm: number;
};

type QuoteForm = {
  usageArea: string;
  woodType: string;
  thicknessMm: number;
  quality: "AB" | "BB" | "CC" | "CD";
  lengthMm?: number;
  widthMm?: number;
  quantity?: number;
  phone: string;
  email: string;
  notes?: string;
  company?: string; // honeypot
};

function asIntOrUndefined(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return Math.trunc(n);
}

function FieldLabel(props: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label
      htmlFor={props.htmlFor}
      className="text-sm font-medium text-foreground/85"
    >
      {props.children}
    </label>
  );
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      ref={ref}
      className={[
        "focus-ring h-11 w-full rounded-xl border border-border/80 bg-surface/60 px-3 text-sm text-foreground placeholder:text-muted/60",
        className ?? "",
      ].join(" ")}
    />
  );
  },
);

Input.displayName = "Input";

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      {...rest}
      className={[
        "focus-ring h-11 w-full rounded-xl border border-border/80 bg-surface/60 px-3 text-sm text-foreground",
        className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={[
        "focus-ring min-h-28 w-full resize-y rounded-xl border border-border/80 bg-surface/60 px-3 py-2 text-sm text-foreground placeholder:text-muted/60",
        className ?? "",
      ].join(" ")}
    />
  );
}

export function QuoteCalculator(props: { calculator: CalculatorConfig }) {
  const thicknessOptions =
    props.calculator.thicknessOptions?.length > 0
      ? props.calculator.thicknessOptions
      : [props.calculator.thicknessDefaultMm];
  const initialThickness = thicknessOptions.includes(
    props.calculator.thicknessDefaultMm,
  )
    ? props.calculator.thicknessDefaultMm
    : thicknessOptions[0];
  const [form, setForm] = useState<QuoteForm>({
    usageArea: props.calculator.usageAreas[0] ?? "Merdiven",
    woodType: props.calculator.woodTypes[0] ?? "Meşe",
    thicknessMm: initialThickness,
    quality: "AB",
    lengthMm: 1200,
    widthMm: 600,
    quantity: 1,
    phone: "",
    email: "",
    notes: "",
    company: "",
  });
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [consent, setConsent] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const areaM2 = useMemo(() => {
    if (!form.lengthMm || !form.widthMm) return null;
    const qty = form.quantity ?? 1;
    const value = ((form.lengthMm * form.widthMm) / 1_000_000) * qty;
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  }, [form.lengthMm, form.widthMm, form.quantity]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone.trim()) {
      setStatus({
        kind: "error",
        message: "Telefon numarası zorunlu.",
      });
      phoneRef.current?.focus();
      return;
    }
    if (!form.email.trim()) {
      setStatus({
        kind: "error",
        message: "E-posta zorunlu.",
      });
      emailRef.current?.focus();
      return;
    }
    if (emailRef.current && !emailRef.current.checkValidity()) {
      setStatus({
        kind: "error",
        message: "Geçerli bir e-posta yazın.",
      });
      emailRef.current.focus();
      return;
    }
    if (!consent) {
      setStatus({
        kind: "error",
        message: "KVKK onayı olmadan gönderim yapılamaz.",
      });
      consentRef.current?.focus();
      return;
    }
    setStatus({ kind: "sending" });

    const payload = {
      type: "quote" as const,
      usageArea: form.usageArea,
      woodType: form.woodType,
      thicknessMm: form.thicknessMm,
      quality: form.quality,
      lengthMm: form.lengthMm,
      widthMm: form.widthMm,
      quantity: form.quantity,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      company: form.company,
      consent: true,
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus({ kind: "success" });
      setConsent(false);
      return;
    }

    const json = (await res.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    setStatus({
      kind: "error",
      message: json?.message || json?.error || "Gönderim başarısız.",
    });
  }

  return (
    <section
      id="hesapla"
      className="mx-auto max-w-6xl scroll-mt-28 px-4 sm:px-6"
    >
      <div className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur sm:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm tracking-[0.22em] text-accent/80">
              TEKLİF HESAPLAMA
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
              İhtiyacınızı seçin, size dönüş yapalım.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">
              Seçimleriniz bize ön bilgi verir. Net fiyatlandırma için ölçü,
              işçilik ve uygulama detaylarını birlikte netleştiririz.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-8 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="usageArea">Kullanım alanı</FieldLabel>
              <Select
                id="usageArea"
                value={form.usageArea}
                onChange={(e) =>
                  setForm((s) => ({ ...s, usageArea: e.target.value }))
                }
              >
                {props.calculator.usageAreas.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="woodType">Ahşap türü</FieldLabel>
              <Select
                id="woodType"
                value={form.woodType}
                onChange={(e) =>
                  setForm((s) => ({ ...s, woodType: e.target.value }))
                }
              >
                {props.calculator.woodTypes.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="thicknessMm">Kalınlık (mm)</FieldLabel>
              <Select
                id="thicknessMm"
                value={String(form.thicknessMm)}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    thicknessMm: Number(e.target.value),
                  }))
                }
              >
                {thicknessOptions.map((value) => (
                  <option key={value} value={String(value)}>
                    {value} mm
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-2">
              <FieldLabel htmlFor="quality">Kalite</FieldLabel>
              <Select
                id="quality"
                value={form.quality}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    quality: e.target.value as QuoteForm["quality"],
                  }))
                }
              >
                {(["AB", "BB", "CC", "CD"] as const).map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <FieldLabel htmlFor="lengthMm">Boy (mm) (ops.)</FieldLabel>
              <Input
                id="lengthMm"
                inputMode="numeric"
                placeholder="Örn: 1200"
                value={form.lengthMm ? String(form.lengthMm) : ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, lengthMm: asIntOrUndefined(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="widthMm">En (mm) (ops.)</FieldLabel>
              <Input
                id="widthMm"
                inputMode="numeric"
                placeholder="Örn: 600"
                value={form.widthMm ? String(form.widthMm) : ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, widthMm: asIntOrUndefined(e.target.value) }))
                }
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="quantity">Adet (ops.)</FieldLabel>
              <Input
                id="quantity"
                inputMode="numeric"
                placeholder="Örn: 1"
                value={form.quantity ? String(form.quantity) : ""}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    quantity: asIntOrUndefined(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-surface/60 px-4 py-3 text-sm">
            <p className="text-muted">Tahmini alan</p>
            <p className="mt-1 font-medium">
              {areaM2 ? `${areaM2.toFixed(2)} m²` : "—"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <FieldLabel htmlFor="phone">Telefon</FieldLabel>
              <Input
                id="phone"
                required
                placeholder="+90 ..."
                ref={phoneRef}
                value={form.phone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <FieldLabel htmlFor="email">E-posta</FieldLabel>
              <Input
                id="email"
                type="email"
                required
                placeholder="ornek@domain.com"
                ref={emailRef}
                value={form.email}
                onChange={(e) =>
                  setForm((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="hidden">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              tabIndex={-1}
              autoComplete="off"
              value={form.company || ""}
              onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="notes">Açıklama (ops.)</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Uygulama detayı, kenar işlemi, teslim tarihi gibi notlar..."
              value={form.notes || ""}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="inline-flex items-center gap-2 text-xs leading-5 text-foreground/80">
              <input
                type="checkbox"
                ref={consentRef}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="focus-ring h-4 w-4 rounded border border-border/80 bg-surface/60"
              />
              KVKK ve gizlilik metnini{" "}
              <Link
                href="/kvkk"
                className="underline decoration-border underline-offset-2"
              >
                okudum
              </Link>
              , onaylıyorum.
            </label>
            <p className="text-xs leading-5 text-muted">
              Gönder butonuna basarak iletişim bilgilerinizin teklif amacıyla
              kullanılmasını kabul edersiniz.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2 disabled:opacity-60"
              disabled={status.kind === "sending"}
            >
              {status.kind === "sending" ? "Gönderiliyor..." : "Gönder"}
            </button>
          </div>

          {status.kind === "success" ? (
            <div className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-sm">
              Talebiniz alındı. En kısa sürede dönüş yapacağız.
            </div>
          ) : null}
          {status.kind === "error" ? (
            <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
              {status.message}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
