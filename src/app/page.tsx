import Image from "next/image";

import { Footer } from "@/app/_components/Footer";
import { Header } from "@/app/_components/Header";
import { MessageFab } from "@/app/_components/MessageFab";
import { ParallaxHero } from "@/app/_components/ParallaxHero";
import { ProductGrid } from "@/app/_components/ProductGrid";
import { QuoteCalculator } from "@/app/_components/QuoteCalculator";
import { TextureParallax } from "@/app/_components/TextureParallax";
import { getContent } from "@/lib/content";

export default async function Home() {
  const content = await getContent();
  const siteUrl = process.env.SITE_URL ?? "https://example.com";

  return (
    <>
      <Header brand={content.brand} />
      <TextureParallax />
      <main className="relative">
        <ParallaxHero brand={content.brand} hero={content.hero} />

        <section
          id="hakkimizda"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm tracking-[0.22em] text-accent/80">HAKKIMIZDA</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.about.heading}
              </h2>
              <p className="mt-4 text-sm leading-6 text-foreground/75">
                {content.about.text}
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-foreground/80">
                {content.about.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/50 p-3 backdrop-blur">
              {content.about.image ? (
                <Image
                  src={content.about.image.src}
                  alt={content.about.image.alt}
                  width={1200}
                  height={900}
                  className="h-72 w-full rounded-2xl object-cover sm:h-96"
                  unoptimized={content.about.image.src.endsWith(".svg")}
                />
              ) : (
                <div className="h-72 w-full rounded-2xl bg-surface/60 sm:h-96" />
              )}
            </div>
          </div>
        </section>

        <section
          id="urunler"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20"
        >
          <ProductGrid
            heading={content.products.heading}
            intro={content.products.intro}
            cards={content.products.cards.map((c) => ({
              title: c.title,
              desc: c.desc,
              details: c.details,
              image: c.image,
            }))}
          />
        </section>

        <section
          id="hizmetler"
          className="relative scroll-mt-28 overflow-hidden py-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_20%,rgba(90,60,40,0.22),transparent_55%),radial-gradient(60%_80%_at_80%_20%,rgba(202,167,106,0.14),transparent_55%)]" />
            <div className="grain absolute -inset-24 opacity-20" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-sm tracking-[0.22em] text-accent/80">
                  HİZMETLER
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                  {content.services.heading}
                </h2>
                <p className="mt-4 text-sm leading-6 text-foreground/75">
                  {content.services.intro}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    className="focus-ring inline-flex items-center justify-center rounded-full border border-border/80 bg-card/60 px-6 py-3 text-sm hover:bg-card/80"
                    href={`mailto:${content.brand.email}`}
                  >
                    E-posta ile İletişim
                  </a>
                  <a
                    className="focus-ring inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-black hover:bg-accent-2"
                    href="#hesapla"
                  >
                    Teklif Oluştur
                  </a>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {content.services.steps.map((x) => (
                  <div
                    key={x.key}
                    className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur"
                  >
                    <p className="text-sm text-accent/80">0{x.key}</p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
                      {x.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground/75">
                      {x.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="servis"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <p className="text-sm tracking-[0.22em] text-accent/80">
                SERVİS BÖLGESİ
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.serviceArea.heading}
              </h2>
              <p className="text-sm leading-6 text-foreground/75">
                {content.serviceArea.intro}
              </p>
              <div className="flex flex-wrap gap-2 text-sm text-foreground/80">
                {content.serviceArea.areas.map((area) => (
                  <div key={area} className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                    {area}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/70">
              <iframe
                className="h-72 w-full border-0 md:h-96"
                title="Servis bölgesi haritası"
                src={content.serviceArea.mapEmbedUrl}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        <div className="py-16 sm:py-20">
          <QuoteCalculator calculator={content.calculator} />
        </div>

        <section
          id="portfoy"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <div>
              <p className="text-sm tracking-[0.22em] text-accent/80">
                PORTFÖY
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.gallery.heading}
              </h2>
              <p className="mt-4 text-sm leading-6 text-foreground/75">
                {content.gallery.intro}
              </p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur">
              <p className="text-sm text-muted">Hızlı iletişim</p>
              <p className="mt-2 text-lg">{content.brand.phone}</p>
              <a
                className="focus-ring mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2"
                href="#hesapla"
              >
                Teklif formuna git
              </a>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.gallery.images.map((img) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-3xl border border-border/70 bg-card/40"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1200}
                  height={900}
                  className="h-52 w-full object-cover"
                  unoptimized={img.src.endsWith(".svg")}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="grid gap-6">
            <div>
              <p className="text-sm tracking-[0.22em] text-accent/80">
                GÜVEN
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.trust.heading}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {content.trust.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur"
                >
                  <p className="font-[family-name:var(--font-display)] text-xl">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/75">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="yorumlar"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <p className="text-sm tracking-[0.22em] text-accent/80">
                YORUMLAR
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.testimonials.heading}
              </h2>
            </div>
            <div className="grid gap-4 md:col-span-2 sm:grid-cols-2">
              {content.testimonials.items.map((t) => (
                <div
                  key={`${t.name}-${t.text}`}
                  className="rounded-3xl border border-border/70 bg-card/50 p-6 backdrop-blur"
                >
                  <p className="text-sm text-muted">
                    {t.name}
                    {t.title ? ` • ${t.title}` : ""}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/80">
                    “{t.text}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="sss"
          className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <div className="grid gap-6 md:grid-cols-2 md:items-start">
            <div>
              <p className="text-sm tracking-[0.22em] text-accent/80">SSS</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl">
                {content.faq.heading}
              </h2>
              <p className="mt-4 text-sm leading-6 text-foreground/75">
                Hızlı cevaplar için en sık sorulanları derledik. Farklı bir
                detay varsa mesaj bırakın.
              </p>
            </div>
            <div className="grid gap-3">
              {content.faq.items.map((x) => (
                <details
                  key={x.q}
                  className="group rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur"
                >
                  <summary className="cursor-pointer list-none text-sm font-medium text-foreground/90">
                    {x.q}
                    <span className="float-right text-muted group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    {x.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Footer brand={content.brand} footer={content.footer} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: content.brand.name,
              url: siteUrl,
              email: content.brand.email,
              telephone: content.brand.phone,
              areaServed: content.brand.city,
              description:
                "Masif ahşap panel satışı ve uygulamaları: merdiven, mutfak tezgâhı, masa, sehpa ve özel projeler.",
            }),
          }}
        />
      </main>

      <MessageFab
        brand={{
          phone: content.brand.phone,
          email: content.brand.email,
          whatsapp: content.brand.whatsapp,
        }}
      />
    </>
  );
}
