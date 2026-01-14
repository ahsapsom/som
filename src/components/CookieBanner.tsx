"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

const STORAGE_KEY = "cookie_consent_v1";

function readConsent(raw: string | null): Consent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.necessary === true) return parsed as Consent;
    return null;
  } catch {
    return null;
  }
}

function safeReadConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    return readConsent(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeConsent(consent: Omit<Consent, "ts">) {
  const payload: Consent = { ...consent, ts: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures (privacy mode, blocked storage, etc.)
  }
  window.dispatchEvent(
    new CustomEvent("cookie-consent-changed", { detail: payload }),
  );
  return payload;
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    const initial = safeReadConsent();
    setConsent(initial);
    setAnalytics(!!initial?.analytics);
    setMarketing(!!initial?.marketing);
    setOpen(initial === null);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const syncConsent = (next: Consent | null) => {
      setConsent(next);
      setAnalytics(!!next?.analytics);
      setMarketing(!!next?.marketing);
    };

    const onOpen = () => {
      const c = safeReadConsent();
      setAnalytics(!!c?.analytics);
      setMarketing(!!c?.marketing);
      setSettings(true);
      setOpen(true);
    };

    const onConsentChange = (event: Event) => {
      if ("detail" in event) {
        const detail = (event as CustomEvent<Consent>).detail;
        if (detail) {
          syncConsent(detail);
          return;
        }
      }
      syncConsent(safeReadConsent());
    };

    window.addEventListener("open-cookie-banner", onOpen as EventListener);
    window.addEventListener(
      "cookie-consent-changed",
      onConsentChange as EventListener,
    );
    window.addEventListener("storage", onConsentChange as EventListener);
    return () => {
      window.removeEventListener(
        "open-cookie-banner",
        onOpen as EventListener,
      );
      window.removeEventListener(
        "cookie-consent-changed",
        onConsentChange as EventListener,
      );
      window.removeEventListener("storage", onConsentChange as EventListener);
    };
  }, [ready]);

  const shouldShow = ready && (open || consent === null);

  if (!shouldShow) return null;

  const acceptAll = () => {
    writeConsent({
      necessary: true,
      analytics: true,
      marketing: false,
    });
    setOpen(false);
    setSettings(false);
  };

  const rejectAll = () => {
    writeConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    setOpen(false);
    setSettings(false);
  };

  const openSettings = () => setSettings(true);

  const saveSettings = () => {
    writeConsent({ necessary: true, analytics, marketing });
    setOpen(false);
    setSettings(false);
  };

  const cancelSettings = () => {
    const c = safeReadConsent();
    setAnalytics(!!c?.analytics);
    setMarketing(!!c?.marketing);
    setOpen(false);
    setSettings(false);
  };

  return (
    <div
      className="pointer-events-auto fixed bottom-3 left-3 right-3 z-[2147483647] md:left-auto md:right-6 md:bottom-6 md:max-w-md"
      role="dialog"
      aria-live="polite"
    >
      <div
        className={[
          "pointer-events-auto rounded-2xl border border-border/70 bg-card/90 shadow-xl backdrop-blur",
          settings ? "p-4" : "p-2",
        ].join(" ")}
      >
        {!settings ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="focus-ring flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2"
              onClick={acceptAll}
            >
              Kabul Et
            </button>
            <button
              type="button"
              className="focus-ring flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-sm hover:bg-surface/80"
              onClick={rejectAll}
            >
              Reddet
            </button>
            <button
              type="button"
              className="focus-ring flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-sm hover:bg-surface/80"
              onClick={openSettings}
            >
              Ayarlar <span aria-hidden="true">⚙</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4 text-sm text-foreground/80">
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-foreground">
                Çerez Tercihleri
              </p>
              <p>
                Zorunlu çerezler sitenin çalışması için gereklidir. Analitik ve
                pazarlama çerezlerini tercihinize göre açabilirsiniz.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <Link
                  href="/privacy"
                  className="underline decoration-border underline-offset-4 hover:text-foreground"
                >
                  Aydınlatma Metni
                </Link>
                <Link
                  href="/cookies"
                  className="underline decoration-border underline-offset-4 hover:text-foreground"
                >
                  Çerez Politikası
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3">
                <span>Zorunlu</span>
                <input type="checkbox" checked disabled />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Analitik</span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span>Pazarlama</span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="focus-ring flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-2"
                onClick={saveSettings}
              >
                Kaydet
              </button>
              <button
                type="button"
                className="focus-ring flex-1 rounded-xl border border-border/80 bg-surface/60 px-4 py-2 text-sm hover:bg-surface/80"
                onClick={cancelSettings}
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
