"use client";

export function Footer(props: {
  brand: {
    name: string;
    tagline: string;
    phone: string;
    email: string;
    city: string;
    address?: string;
  };
  footer: { blurb: string; fineprint?: string };
}) {
  return (
    <footer
      id="iletisim"
      className="mx-auto max-w-6xl scroll-mt-28 px-4 sm:px-6"
    >
      <div className="rounded-3xl border border-border/70 bg-surface/90 p-6 backdrop-blur sm:p-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl">
              {props.brand.name}
            </p>
            <p className="mt-2 text-sm text-foreground/75">
              {props.brand.tagline}
            </p>
            <p className="mt-4 text-sm text-muted">
              {props.footer.blurb}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">İletişim</p>
            <ul className="mt-3 grid gap-2 text-sm text-foreground/80">
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href={`tel:${props.brand.phone.replaceAll(" ", "")}`}
                >
                  {props.brand.phone}
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href={`mailto:${props.brand.email}`}
                >
                  {props.brand.email}
                </a>
              </li>
              <li className="text-muted">{props.brand.city}</li>
              {props.brand.address ? (
                <li className="text-sm text-foreground/70">{props.brand.address}</li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Hızlı bağlantılar</p>
            <ul className="mt-3 grid gap-2 text-sm text-foreground/80">
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="#urunler"
                >
                  Ürünler
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="#hizmetler"
                >
                  Hizmetler
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="#hesapla"
                >
                  Teklif hesaplama
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="/gizlilik"
                >
                  Gizlilik
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="/kvkk"
                >
                  KVKK
                </a>
              </li>
              <li>
                <a
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  href="/cerez-politikasi"
                >
                  Çerez Politikası
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="focus-ring rounded-md underline decoration-border underline-offset-4 hover:text-foreground"
                  onClick={() =>
                    window.dispatchEvent(new Event("open-cookie-banner"))
                  }
                >
                  Çerez Tercihleri
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {props.brand.name}. Tüm hakları
            saklıdır.
          </p>
          <p className="text-foreground/60">
            {props.footer.fineprint ?? "Mobil uyumlu • Hızlı • SEO uyumlu"}
          </p>
        </div>
      </div>
    </footer>
  );
}
