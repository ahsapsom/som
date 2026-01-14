Masif ahşap panel satışı ve uygulamaları için tek sayfa (one-page) web sitesi.

## Kurulum

1) Bağımlılıkları kurun:

```bash
npm install
```

2) E-posta gönderimi için `.env.local` oluşturun:

```bash
cp .env.example .env.local
```

`.env.local` içinde en az şunları doldurun:

- `SITE_URL` (prod domain)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `MAIL_FROM`, `MAIL_TO`

3) Geliştirme ortamını başlatın:

```bash
npm run dev
```

Site: `http://localhost:3000`

## Formlar

- Teklif hesaplama: sayfa içindeki form → `POST /api/contact` (`type: "quote"`)
- Mesaj butonu: sağ alttaki modal → `POST /api/contact` (`type: "message"`)

## Admin Panel

`/admin` üzerinden tüm metin ve görselleri yönetebilirsiniz.

Gereken env:

- `ADMIN_PASSWORD`
- `ADMIN_SECRET`

Varsayılan olarak admin şifresi `Som1881` (örnek `.env` dosyasında da bu değer bulunuyor); canlıda `ADMIN_SECRET` ve şifreyi özgün tutmayı unutmayın.

Notlar:

- İçerik verisi `data/content.json` içinde tutulur.
- Yüklenen görseller `public/uploads/` altına kaydedilir (gitignore).
- Sunucusuz (serverless) ortamlarda dosya yazımı kalıcı olmayabilir; kalıcı admin için DB/S3 entegrasyonu gerekir.
- Gelen talepler `data/leads.json` içinde saklanır; admin panelde “Gelen talepler” ile görüntülenir ve `/api/admin/leads` üzerinden çekilir.

## Özelleştirme

- İçerik / firma bilgileri: `data/content.json` (admin: `/admin`)
- Sayfa düzeni: `src/app/page.tsx`
- Tema ve renkler: `src/app/globals.css`

## Gizlilik & analitik

- KVKK metni: `/kvkk`
- Gizlilik politikası: `/gizlilik`
- Çerez politikası: `/cerez-politikasi` (banner altta çıkar)
- Formlar KVKK onayı gerektirir; checkbox ve linkler zaten formların yanında bulunur.
- Cookie banner sadece “Kabul et” seçildiğinde Google Analytics script’i çalışır.
- Analitik için `GA_MEASUREMENT_ID` env veya `content.seo.gaMeasurementId` alanını ayarlayın.
- Arka plan parallax metni: `TextureParallax` katmanı `public/textures/wood-layer-*.svg` dosyalarını kullanır; kendi PNG’lerini bu klasöre atıp isimleriyle değiştirerek arka planı özelleştirebilirsin.
# trigger
