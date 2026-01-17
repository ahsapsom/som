"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

import { normalizeImageSrc } from "@/lib/imagePath";

const nav = [
  { href: "#hakkimizda", label: "Hakkımızda" },
  { href: "#urunler", label: "Ürünler" },
  { href: "#hizmetler", label: "Hizmetler" },
  { href: "#portfoy", label: "Portföy" },
  { href: "#servis", label: "Servis" },
  { href: "#hesapla", label: "Hesaplama" },
  { href: "#sss", label: "SSS" },
  { href: "#iletisim", label: "İletişim" },
] as const;

export function Header(props: {
  brand: {
    name: string;
    tagline: string;
    phone: string;
    logo?: string;
    logoHeight?: number;
    logoMaxWidth?: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const logoSrc = normalizeImageSrc(props.brand.logo);
  const phoneHref = useMemo(
    () => `tel:${props.brand.phone.replaceAll(" ", "")}`,
    [props.brand.phone],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 24;
      setCompact((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogoClick(e: MouseEvent<HTMLAnchorElement>) {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    window.location.href = "/";
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 transition-all duration-200">
      <div
        className={`relative mx-auto flex max-w-9xl items-center gap-4 px-4 ${
          compact ? "py-2" : "py-4"
        } sm:px-6`}
      >
        <div className="flex flex-1 items-center gap-4 md:justify-center md:gap-6">
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-3"
            aria-label={`${props.brand.name} ana sayfa`}
            onClick={handleLogoClick}
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={`${props.brand.name} logo`}
                width={props.brand.logoMaxWidth ?? 160}
                height={props.brand.logoHeight ?? 64}
                style={{
                  height: props.brand.logoHeight
                    ? `${props.brand.logoHeight}px`
                    : undefined,
                  maxHeight: props.brand.logoHeight
                    ? `${props.brand.logoHeight}px`
                    : undefined,
                  maxWidth: props.brand.logoMaxWidth
                    ? `${props.brand.logoMaxWidth}px`
                    : undefined,
                }}
                className={`headerLogo ${compact ? "headerLogoCompact" : ""}`}
                priority
                unoptimized={logoSrc.endsWith(".svg")}
              />
            ) : (
              <span className="font-[family-name:var(--font-display)] text-lg tracking-[0.35em]">
                {props.brand.name}
              </span>
            )}
            <span className="hidden text-[0.55rem] uppercase tracking-[0.45em] text-foreground/70 sm:inline">
              {props.brand.tagline}
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-foreground/90 md:flex">
            {nav.map((item) => (
              <a
                key={item.href}
              className="focus-ring headerNavLink inline-flex"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            className="focus-ring headerPhoneLink hidden md:inline-flex"
            href={phoneHref}
          >
            {props.brand.phone}
          </a>
        </div>

        <button
          type="button"
          className="focus-ring ml-auto inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-sm text-foreground/80 transition hover:text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menü
        </button>

        {open ? (
          <div
            id="mobile-nav"
            className="absolute inset-x-0 top-full z-50 mt-1 rounded-2xl border border-border/50 bg-white/70 p-4 shadow-lg backdrop-blur-md"
          >
            <div className="flex flex-col gap-3">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="focus-ring rounded-xl px-3 py-2 text-sm text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                className="focus-ring inline-flex items-center justify-center rounded-xl border border-accent/30 px-4 py-2 text-sm"
                href={phoneHref}
                onClick={() => setOpen(false)}
              >
                {props.brand.phone}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
