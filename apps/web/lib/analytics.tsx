import Script from "next/script";
import { Suspense } from "react";
import { PublicAnalytics } from "./public-analytics";

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {gaId ? <Suspense fallback={null}><PublicAnalytics measurementId={gaId}/></Suspense> : null}
      {plausibleDomain ? <Script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" strategy="afterInteractive" /> : null}
    </>
  );
}
