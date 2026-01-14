"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

type Consent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

const STORAGE_KEY = "cookie_consent_v1";

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.necessary === true) return parsed as Consent;
    return null;
  } catch {
    return null;
  }
}

export function Analytics() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    const syncConsent = () => setConsent(readConsent());
    syncConsent();

    const onChange = (event: Event) => {
      if ("detail" in event) {
        const detail = (event as CustomEvent<Consent>).detail;
        if (detail) {
          setConsent(detail);
          return;
        }
      }
      syncConsent();
    };

    window.addEventListener("cookie-consent-changed", onChange as EventListener);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener(
        "cookie-consent-changed",
        onChange as EventListener,
      );
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  return (
    <>
      {consent?.analytics && gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              gaId,
            )}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
      {consent?.marketing && metaId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
