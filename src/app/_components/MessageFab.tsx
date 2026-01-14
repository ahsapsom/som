"use client";

import Link from "next/link";
import { forwardRef, useMemo, useRef, useState } from "react";

type Brand = {
  phone: string;
  email: string;
  whatsapp?: string;
};

type MessageForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  notes?: string;
  company?: string;
};

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

export function MessageFab(props: { brand: Brand }) {
  const [open, setOpen] = useState(false);
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

  const [form, setForm] = useState<MessageForm>({
    name: "",
    email: "",
    phone: "",
    subject: "Bilgi almak istiyorum",
    message: "",
    company: "",
  });

  const mailtoHref = useMemo(
    () => `mailto:${props.brand.email}`,
    [props.brand.email],
  );
  const whatsappHref = useMemo(() => {
    const raw = props.brand.whatsapp ?? props.brand.phone;
    const digits = raw?.replaceAll(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  }, [props.brand.whatsapp, props.brand.phone]);

  const phoneHref = useMemo(() => {
    const raw = props.brand.phone?.trim() ?? "";
    const digits = raw.replaceAll(/[^\d]/g, "");
    if (!digits) return null;
    const prefix = raw.startsWith("+") ? "+" : "";
    return `tel:${prefix}${digits}`;
  }, [props.brand.phone]);

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
        message: "KVKK onayı olmadan mesaj gönderilemez.",
      });
      consentRef.current?.focus();
      return;
    }
    setStatus({ kind: "sending" });

    const payload = { type: "message" as const, ...form, notes: "", consent: true };
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
    <>
      <a
        href={mailtoHref}
        className="focus-ring fixed bottom-4 left-4 z-40 hidden rounded-full border border-border/70 bg-surface/70 px-4 py-3 text-sm backdrop-blur hover:bg-surface/90 sm:inline-flex"
        aria-label="E-posta ile iletişim"
      >
        E-posta
      </a>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="focus-ring fixed bottom-16 left-4 z-40 hidden rounded-full border border-border/70 bg-surface/70 px-4 py-3 text-sm backdrop-blur hover:bg-surface/90 sm:inline-flex"
          aria-label="WhatsApp ile iletişim"
        >
          WhatsApp
        </a>
      ) : null}
      <div className="fixed bottom-6 left-1/2 z-40 flex items-center gap-2 -translate-x-1/2 transform">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-sm font-medium text-foreground shadow-lg transition hover:bg-accent hover:text-white"
            aria-label="WhatsApp ile mesaj at"
          >
            <img
              src="/whatsapp.png"
              alt="WhatsApp"
              className="h-6 w-6 object-contain"
              width={24}
              height={24}
            />
          </a>
        ) : null}
        {phoneHref ? (
          <a
            href={phoneHref}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-sm font-medium text-foreground shadow-lg transition hover:bg-accent hover:text-white"
            aria-label="Telefonla ara"
          >
            <img
              src="/phone.png"
              alt="Telefon"
              className="h-6 w-6 object-contain"
              width={24}
              height={24}
            />
          </a>
        ) : null}
        <button
          type="button"
          className="focus-ring inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-black hover:bg-accent-2"
          onClick={() => {
            setOpen(true);
            setStatus({ kind: "idle" });
            setConsent(false);
          }}
        >
          Mesaj
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mesaj gönder"
          className="fixed inset-0 z-50"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl rounded-t-3xl border border-border/70 bg-card/95 p-6 backdrop-blur sm:bottom-auto sm:top-24 sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm tracking-[0.22em] text-accent/80">
                  İLETİŞİM
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                  Mesaj bırakın, dönüş yapalım.
                </p>
              </div>
              <button
                type="button"
                className="focus-ring rounded-xl border border-border/80 bg-surface/50 px-3 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Kapat
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="m_name">Ad Soyad</FieldLabel>
                  <Input
                    id="m_name"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="m_phone">Telefon</FieldLabel>
                  <Input
                    id="m_phone"
                    required
                    ref={phoneRef}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel htmlFor="m_email">E-posta</FieldLabel>
                  <Input
                    id="m_email"
                    type="email"
                    required
                    ref={emailRef}
                    value={form.email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, email: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <FieldLabel htmlFor="m_subject">Konu</FieldLabel>
                  <Input
                    id="m_subject"
                    required
                    value={form.subject}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, subject: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="hidden">
                <label htmlFor="m_company">Company</label>
                <input
                  id="m_company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company || ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, company: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor="m_message">Mesaj</FieldLabel>
                <Textarea
                  id="m_message"
                  required
                  placeholder="Projenizi kısaca anlatın..."
                  value={form.message}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, message: e.target.value }))
                  }
                />
              </div>

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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted">
                  Alternatif:{" "}
                  <a
                    className="underline decoration-border underline-offset-4 hover:text-foreground"
                    href={mailtoHref}
                  >
                    {props.brand.email}
                  </a>
                </p>
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
                  Mesajınız alındı. Teşekkürler.
                </div>
              ) : null}
              {status.kind === "error" ? (
                <div className="rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
                  {status.message}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
