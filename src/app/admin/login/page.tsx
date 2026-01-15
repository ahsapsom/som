import { loginAction } from "@/app/admin/login/actions";

export default async function AdminLoginPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const error = sp.error;
  return (
    <main className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="grain pointer-events-none absolute -inset-24 opacity-30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_20%_0%,rgba(202,167,106,0.18),transparent_60%),radial-gradient(60%_80%_at_80%_0%,rgba(139,90,53,0.16),transparent_60%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-4 py-16">
          <div className="w-full rounded-3xl border border-border/70 bg-card/70 p-6 backdrop-blur sm:p-10">
            <p className="text-sm tracking-[0.22em] text-accent/80">ADMIN</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight">
              İçerik Yönetimi
            </h1>
            <p className="mt-3 text-sm text-foreground/75">
              Devam etmek için yönetici şifresi girin.
            </p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-danger/25 bg-danger/10 p-4 text-sm">
                {error === "invalid"
                  ? "Şifre hatalı."
                  : error === "missing-env"
                    ? "Sunucu ayarında ADMIN_PASSWORD eksik."
                    : "Şifre gerekli."}
              </div>
            ) : null}

            <form action={loginAction} className="mt-8 grid gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground/85"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="focus-ring h-11 w-full rounded-xl border border-border/80 bg-surface/60 px-3 text-sm text-foreground"
                />
              </div>
              <button
                type="submit"
                className="focus-ring inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-black hover:bg-accent-2"
              >
                Giriş
              </button>
              <p className="text-xs text-muted">
                Not: Şifre `.env.local` içindeki `ADMIN_PASSWORD` ile kontrol
                edilir.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
