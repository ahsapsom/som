export const metadata = {
  title: "Çerez Politikası",
};

export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Çerez Politikası
      </h1>
      <p className="mt-6 text-sm leading-7 text-foreground/80">
        Bu sayfa örnek amaçlıdır. Çerezler; tercihleri hatırlamak ve (onay
        verilirse) site kullanımını analiz etmek için kullanılabilir.
      </p>
      <div className="mt-10 grid gap-4 text-sm leading-7 text-foreground/80">
        <p>
          Zorunlu çerezler: site güvenliği ve temel işlevsellik için
          kullanılabilir.
        </p>
        <p>
          Analitik çerezler: yalnızca “Kabul et” seçildiğinde etkinleşir.
        </p>
        <p>
          İstediğiniz zaman tarayıcı ayarlarından çerezleri temizleyebilir veya
          engelleyebilirsiniz.
        </p>
      </div>
    </main>
  );
}

