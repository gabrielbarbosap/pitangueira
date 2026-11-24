"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useConsentimento } from "@/lib/consentimento";

/**
 * Carrega Google Analytics (GA4) e Pixel da Meta — mas SÓ quando a pessoa aceita os cookies E os IDs estão
 * configurados. Sem consentimento ou sem ID, nada de terceiros é baixado (seguro para publicar antes de ter conta).
 *
 * IDs em variáveis de ambiente públicas (ficam no HTML, não são segredo):
 *   NEXT_PUBLIC_GA_ID          ex.: G-XXXXXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID  ex.: 1234567890
 *
 * Os eventos do app vão para o GA/Pixel por lib/analytics.ts (window.gtag / window.fbq).
 */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export function Analytics() {
  const { aceito } = useConsentimento();
  const pathname = usePathname();
  const primeira = useRef(true);

  // Cada navegação dentro do app (SPA) conta como uma nova visualização. A 1ª já é contada na carga do script.
  useEffect(() => {
    if (!aceito) return;
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
    if (GA_ID && typeof w.gtag === "function") w.gtag("event", "page_view", { page_path: pathname });
    if (PIXEL_ID && typeof w.fbq === "function") w.fbq("track", "PageView");
  }, [pathname, aceito]);

  if (!aceito) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`,
            }}
          />
        </>
      )}
      {PIXEL_ID && (
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`,
          }}
        />
      )}
    </>
  );
}
