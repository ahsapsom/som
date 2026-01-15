"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { SiteContent } from "@/lib/contentSchema";
import { normalizeImageSrc } from "@/lib/imagePath";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getVideoSrc(url: string) {
  const match = url.match(/(?:embed\/|watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (!match) return null;
  const id = match[1];
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&vq=hd1080&playlist=${id}`;
}

type QuickStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function ParallaxHero(props: {
  brand: SiteContent["brand"];
  hero: SiteContent["hero"];
}) {
  const [scrollY, setScrollY] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [quickEmail, setQuickEmail] = useState("");
  const [quickConsent, setQuickConsent] = useState(false);
  const [quickStatus, setQuickStatus] = useState<QuickStatus>({
    kind: "idle",
  });
  const quickEmailRef = useRef<HTMLInputElement>(null);
  const quickConsentRef = useRef<HTMLInputElement>(null);
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(
      props.hero.quickOptions.map((option) => [option.label, ""]),
    ),
  );

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY || 0));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const offset = clamp(scrollY * 0.12, 0, 70);
  const textureOffset = clamp(scrollY * 0.06, 0, 40);
  const videoSrc = props.hero.heroVideo?.url
    ? getVideoSrc(props.hero.heroVideo.url)
    : null;
  const heroImageSrc = normalizeImageSrc(props.hero.heroImage?.src);

  async function onQuickSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickEmail.trim()) {
      setQuickStatus({
        kind: "error",
        message: "Lütfen e-posta adresinizi yazın.",
      });
      quickEmailRef.current?.focus();
      return;
    }
    if (quickEmailRef.current && !quickEmailRef.current.checkValidity()) {
      setQuickStatus({
        kind: "error",
        message: "Geçerli bir e-posta yazın.",
      });
      quickEmailRef.current.focus();
      return;
    }
    if (!quickConsent) {
      setQuickStatus({
        kind: "error",
        message: "KVKK onayını işaretleyin.",
      });
      quickConsentRef.current?.focus();
      return;
    }
    setQuickStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "quick",
          email: quickEmail.trim(),
          notes: "",
          company: "",
          consent: true,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        throw new Error(json?.message || json?.error || "Gönderim başarısız.");
      }
      setQuickStatus({
        kind: "success",
        message: "Talebiniz alındı. Dönüş yapacağız.",
      });
      setQuickEmail("");
      setQuickConsent(false);
    } catch (error) {
      setQuickStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Gönderim başarısız.",
      });
    }
  }

  const heroVideoLayer = videoSrc ? (
    <div className="pointer-events-none fixed inset-0 -z-30 hero-video-layer">
      <div className="absolute inset-0 overflow-hidden">
        <iframe
          src={videoSrc}
          title={props.hero.heroVideo?.title ?? "Hero video"}
          className="hero-video-frame absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; encrypted-media"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60" />
        <div
          className="grain absolute -inset-24 opacity-30"
          style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        />
        {heroImageSrc ? (
          <div
            className="absolute -inset-16 opacity-30"
            style={{
              transform: `translate3d(0, ${textureOffset}px, 0)`,
            }}
          >
            <Image
              src={heroImageSrc}
              alt={props.hero.heroImage?.alt ?? ""}
              fill
              className="object-cover"
              priority
              unoptimized={heroImageSrc.endsWith(".svg")}
            />
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      {heroVideoLayer}
      <section
        aria-label="Hero"
        className="relative h-[100svh] w-full overflow-hidden pt-10 mt-0 hero-no-safe"
      >
        <div className="relative z-10 mx-auto max-w-6xl h-full px-4 pt-0 pb-10 sm:px-6">
          <div className="grid gap-10 items-start lg:grid-cols-[minmax(0,1fr)_440px]">
            <div className="space-y-6 text-foreground/90">
              <p className="text-xs uppercase tracking-[0.6em] text-foreground/70">
                {props.hero.eyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
                {props.hero.headline}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-foreground/80">
                {props.hero.subhead}
              </p>
              <div className="flex flex-wrap gap-3">
                {props.hero.highlights.map((highlight) => (
                  <div
                    key={highlight.title}
                    className="rounded-2xl border border-foreground/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.4em] text-foreground/70"
                  >
                    <strong className="block text-lg text-foreground">
                      {highlight.value}
                    </strong>
                    {highlight.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-16 lg:mt-24">
              <div className="rounded-[34px]">
                <button
                  type="button"
                  className={`panelTrigger w-full rounded-[34px] border transition ${
                    panelOpen
                      ? "border-white/70 bg-white/85 px-6 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.15)]"
                      : "border-transparent bg-transparent px-4 py-3 text-left uppercase tracking-[0.5em]"
                  } text-sm text-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
                  aria-expanded={panelOpen}
                  aria-controls="quick-options-panel"
                  onClick={() => {
                    setPanelOpen(false);
                    const target = document.getElementById("hesapla");
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  <span className="block text-base text-foreground">
                    Panel Seç
                  </span>
                  <span className="text-[0.6rem] tracking-[0.4em] text-foreground/70">
                    Fiyat Öğren
                  </span>
                </button>

                <div
                  id="quick-options-panel"
                  className={`${panelOpen ? "block mt-6 panelContent" : "hidden"}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="panelHeading">
                      Panel seç, ölçü gir, gönder.
                    </p>
                    <div
                      className="hidden h-12 w-12 items-center justify-center rounded-2xl text-foreground/70 md:flex"
                      style={{ backgroundColor: "rgba(139, 90, 53, 0.12)" }}
                    >
                      %
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
                    {props.hero.quickOptions.map((option) => {
                      const selected = selections[option.label] ?? "";
                      return (
                        <label
                          key={option.label}
                          className="grid gap-1 rounded-2xl border border-border/70 bg-surface/70 p-3"
                        >
                          <span className="text-sm text-foreground/70">
                            {option.label}
                          </span>
                          <div className="relative">
                            <select
                              aria-label={option.label}
                              value={selected}
                              onChange={(event) =>
                                setSelections((prev) => ({
                                  ...prev,
                                  [option.label]: event.target.value,
                                }))
                              }
                              className="h-10 w-full appearance-none rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground focus:ring-2 focus:ring-accent"
                            >
                              <option value="" disabled hidden>
                                {option.placeholder ?? "Seçim yapın"}
                              </option>
                              {option.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-foreground/60">
                              ▼
                            </span>
                          </div>
                          {option.note ? (
                            <p className="text-[0.65rem] text-foreground/60">
                              {option.note}
                            </p>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-5 text-xs leading-5 text-foreground/70">
                    {props.hero.note}
                  </p>

                  <form onSubmit={onQuickSubmit} className="mt-4 grid gap-2">
                    <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-white/70 px-4 py-3 text-sm text-foreground/80 sm:flex-row sm:items-center">
                      <span className="text-xs text-foreground/70">
                        Hızlı iletişim için e-posta bırakın
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="email"
                          required
                          aria-label="E-posta"
                          placeholder="ornek@domain.com"
                          ref={quickEmailRef}
                          value={quickEmail}
                          onChange={(event) =>
                            setQuickEmail(event.target.value)
                          }
                          className="h-10 flex-1 rounded-xl border border-border/80 bg-white px-3 text-sm text-foreground"
                        />
                        <button
                          type="submit"
                          className="focus-ring inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-xs font-medium text-black hover:bg-accent-2 disabled:opacity-60"
                          disabled={quickStatus.kind === "sending"}
                        >
                          {quickStatus.kind === "sending"
                            ? "Gönderiliyor..."
                            : "Gönder"}
                        </button>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs leading-5 text-foreground/80">
                      <input
                        type="checkbox"
                        ref={quickConsentRef}
                        checked={quickConsent}
                        onChange={(event) =>
                          setQuickConsent(event.target.checked)
                        }
                        className="focus-ring h-4 w-4 rounded border border-border/80 bg-surface/60"
                      />
                      KVKK ve gizlilik metnini{" "}
                      <a
                        href="/kvkk"
                        className="underline decoration-border underline-offset-2"
                      >
                        okudum
                      </a>
                      , onaylıyorum.
                    </label>
                    {quickStatus.kind === "success" ? (
                      <div className="rounded-2xl border border-accent/25 bg-accent/10 p-3 text-xs">
                        {quickStatus.message}
                      </div>
                    ) : null}
                    {quickStatus.kind === "error" ? (
                      <div className="rounded-2xl border border-danger/25 bg-danger/10 p-3 text-xs">
                        {quickStatus.message}
                      </div>
                    ) : null}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
