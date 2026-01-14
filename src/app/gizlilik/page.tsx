export const metadata = {
  title: "Gizlilik Politikası",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        Gizlilik Politikası
      </h1>
      <p className="mt-6 text-sm leading-7 text-foreground/80">
        Bu sayfa örnek amaçlıdır. Formlar üzerinden iletilen bilgiler yalnızca
        teklif ve iletişim süreçleri için kullanılır.
      </p>
      <div className="mt-10 grid gap-4 text-sm leading-7 text-foreground/80">
        <p>
          Güvenlik amacıyla teknik kayıtlar tutulabilir. Gerektiğinde spam ve
          kötüye kullanım denetimleri uygulanır.
        </p>
        <p>
          Üçüncü parti servisler (ör. SMTP sağlayıcısı, analiz aracı) kendi
          politikalarına tabidir. Analiz çerezleri yalnızca onay verdiğinizde
          çalışır.
        </p>
      </div>
    </main>
  );
}

