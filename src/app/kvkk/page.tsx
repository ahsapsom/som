export const metadata = {
  title: "KVKK Aydınlatma Metni",
};

export default function KvkkPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
        KVKK Aydınlatma Metni
      </h1>
      <p className="mt-6 text-sm leading-7 text-foreground/80">
        Bu metin örnek amaçlıdır. İşletmenizin ünvanı, adresi, veri sorumlusu
        bilgileri, amaçlar ve saklama süreleri gibi detaylar hukuk danışmanınızla
        birlikte düzenlenmelidir.
      </p>
      <div className="mt-10 grid gap-4 text-sm leading-7 text-foreground/80">
        <p>
          Web sitemiz üzerinden ilettiğiniz ad-soyad, telefon, e-posta ve mesaj
          içerikleri; teklif oluşturma, sizinle iletişime geçme ve talebinizi
          yönetme amaçlarıyla işlenir.
        </p>
        <p>
          Veriler, e-posta altyapısı ve hosting sağlayıcıları gibi hizmet
          sağlayıcılarla sınırlı olarak paylaşılabilir.
        </p>
        <p>
          KVKK kapsamındaki haklarınız için iletişim kanallarımız üzerinden
          başvuru yapabilirsiniz.
        </p>
      </div>
    </main>
  );
}

