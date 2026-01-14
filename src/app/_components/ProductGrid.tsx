"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Card = {
  title: string;
  desc: string;
  details?: string;
  image?: { src: string; alt: string; thumb?: string };
};

export function ProductGrid(props: {
  heading: string;
  intro: string;
  cards: Card[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = useMemo(
    () => (openIndex === null ? null : props.cards[openIndex] ?? null),
    [openIndex, props.cards],
  );

  return (
    <>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm tracking-[0.22em] text-accent/80">ÜRÜNLER</p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
            {props.heading}
          </h2>
          <p className="mt-4 text-sm leading-6 text-foreground/75">
            {props.intro}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {props.cards.map((c, idx) => (
            <button
              key={`${c.title}-${idx}`}
              type="button"
              className="focus-ring text-left rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur hover:bg-card/70"
              onClick={() => setOpenIndex(idx)}
            >
              {c.image ? (
                <div className="mb-4 overflow-hidden rounded-2xl border border-border/60">
                  <Image
                    src={c.image.thumb ?? c.image.src}
                    alt={c.image.alt}
                    width={1200}
                    height={800}
                    className="h-36 w-full object-cover"
                    unoptimized={(c.image.thumb ?? c.image.src).endsWith(".svg")}
                  />
                </div>
              ) : null}
              <p className="font-[family-name:var(--font-display)] text-xl">
                {c.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/75">
                {c.desc}
              </p>
              <p className="mt-3 text-xs text-accent/80">Detayları gör</p>
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${active.title} detayları`}
          className="fixed inset-0 z-50"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpenIndex(null)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl border border-border/70 bg-card/95 p-6 backdrop-blur sm:bottom-auto sm:top-20 sm:rounded-3xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm tracking-[0.22em] text-accent/80">
                  ÜRÜN DETAYI
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                  {active.title}
                </p>
                <p className="mt-2 text-sm text-foreground/80">{active.desc}</p>
              </div>
              <button
                type="button"
                className="focus-ring rounded-xl border border-border/80 bg-surface/50 px-3 py-2 text-sm"
                onClick={() => setOpenIndex(null)}
              >
                Kapat
              </button>
            </div>

            {active.image ? (
              <div className="mt-6 overflow-hidden rounded-3xl border border-border/60">
                <Image
                  src={active.image.src}
                  alt={active.image.alt}
                  width={1200}
                  height={900}
                  className="h-64 w-full object-cover sm:h-80"
                  unoptimized={active.image.src.endsWith(".svg")}
                />
              </div>
            ) : null}

            {active.details ? (
              <p className="mt-6 text-sm leading-7 text-foreground/80">
                {active.details}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <a
                href="#hesapla"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2"
                onClick={() => setOpenIndex(null)}
              >
                Teklif al
              </a>
              <a
                href="#iletisim"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-full border border-border/80 bg-surface/50 px-6 text-sm hover:bg-surface/70"
                onClick={() => setOpenIndex(null)}
              >
                İletişim
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

