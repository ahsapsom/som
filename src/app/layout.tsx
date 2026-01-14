import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import { readContent } from "@/lib/contentStore";
import { Analytics } from "@/app/_components/Analytics";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.SITE_URL ?? "https://example.com";
  const content = await readContent().catch(() => null);
  const title = content?.seo?.title ?? "Masif Ahşap";
  const description = content?.seo?.description ?? "";
  const keywords = content?.seo?.keywords ?? [];
  const ogImage = content?.seo?.ogImage;
  const brandName = content?.brand?.name ?? "Masif Ahşap";
  const googleSiteVerification = content?.seo?.googleSiteVerification?.trim();

  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${brandName}` },
    description,
    applicationName: brandName,
    keywords,
    alternates: { canonical: "/" },
    verification: googleSiteVerification
      ? { google: googleSiteVerification }
      : undefined,
    openGraph: {
      title,
      description,
      url: "/",
      siteName: brandName,
      locale: "tr_TR",
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b0b0a",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = await readContent().catch(() => null);
  const themeStyle = content?.theme
    ? ({
        "--background": content.theme.colors.background,
        "--foreground": content.theme.colors.foreground,
        "--surface": content.theme.colors.surface,
        "--card": content.theme.colors.card,
        "--muted": content.theme.colors.muted,
        "--border": content.theme.colors.border,
        "--accent": content.theme.colors.accent,
        "--accent-soft": content.theme.colors.accentSoft,
        "--danger": content.theme.colors.danger,
        "--wood-bark": content.theme.colors.woodBark,
        "--wood-core": content.theme.colors.woodCore,
        "--wood-halo": content.theme.colors.woodHalo,
        "--font-sans": content.theme.typography.sans,
        "--font-display": content.theme.typography.display,
      } as CSSProperties)
    : undefined;
  return (
    <html lang="tr" className="scroll-smooth">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
        style={themeStyle}
      >
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
