"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "./public-analytics.css";
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
const consentKey = "eclipse-systems-analytics-consent";
const privatePath = (path: string) =>
  !(
    path === "/" ||
    /^\/(contact|schedule-demo|blog|features|industries|locations|pricing|plans|vs|alternatives|glossary|utbms|webinars|help-center|developer-documentation|invoice-template|demos)(\/|$)/.test(
      path,
    )
  );
export function PublicAnalytics({ measurementId }: { measurementId: string }) {
  const path = usePathname(),
    [choice, setChoice] = useState<string | null>("pending");
  const valid = /^G-[A-Z0-9]{5,20}$/.test(measurementId);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setChoice(localStorage.getItem(consentKey));
      } catch {
        setChoice("denied");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!valid || choice !== "granted" || !path || privatePath(path)) return;
    (window as unknown as Record<string, unknown>)[
      "ga-disable-" + measurementId
    ] = false;
    const location = new URL(path, window.location.origin);
    const params = new URLSearchParams(window.location.search);
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const value = params.get(key);
      if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value))
        location.searchParams.set(key, value);
    }
    let referrer = "";
    try {
      referrer = new URL(document.referrer).origin;
    } catch {}
    if (!window.gtag) {
      window.dataLayer = window.dataLayer ?? [];
      window.gtag = function () {
        // Preserve Google's documented argument-queue contract.
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        page_location: location.href,
        page_referrer: referrer,
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      const script = document.createElement("script");
      script.id = "eclipse-systems-google-tag";
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
      document.head.appendChild(script);
    }
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("set", {
      page_location: location.href,
      page_referrer: referrer,
    });
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: location.href,
      page_referrer: referrer,
    });
    const onClick = (event: MouseEvent) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        element instanceof HTMLAnchorElement &&
        !element.href.startsWith("tel:")
      ) {
        try {
          const target = new URL(element.href);
          if (
            target.origin === window.location.origin &&
            ["/contact", "/schedule-demo", "/demos", "/pricing"].includes(
              target.pathname,
            )
          )
            window.gtag?.("event", "cta_click", {
              destination: target.pathname,
              page_path: path,
              page_location: location.href,
              transport_type: "beacon",
            });
        } catch {}
      }
      const anchor = element?.matches('a[href^="tel:"]') ? element : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const phone = anchor.getAttribute("href")?.replace(/[^\d]/g, "");
      if (!["12059554028", "2059554028"].includes(phone ?? "")) return;
      window.gtag?.("event", "click_to_call_garrett", {
        contact: "garrett",
        page_path: path,
        page_location: location.href,
        transport_type: "beacon",
      });
    };
    const onLead = () =>
      window.gtag?.(
        "event",
        path === "/contact" ? "contact_submit" : "demo_request",
        {
          page_path: path,
          page_location: location.href,
          transport_type: "beacon",
        },
      );
    document.addEventListener("click", onClick);
    document.addEventListener("eclipse-systems:lead-confirmed", onLead);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("eclipse-systems:lead-confirmed", onLead);
      (window as unknown as Record<string, unknown>)[
        "ga-disable-" + measurementId
      ] = true;
    };
  }, [valid, choice, path, measurementId]);
  function choose(value: string) {
    try {
      localStorage.setItem(consentKey, value);
    } catch {}
    setChoice(value);
    if (value === "denied")
      (window as unknown as Record<string, unknown>)[
        "ga-disable-" + measurementId
      ] = true;
    if (value === "denied")
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
  }
  if (!valid || !path || privatePath(path) || choice === "pending") return null;
  if (choice !== null)
    return (
      <button
        type="button"
        className="analytics-preferences"
        onClick={() => setChoice(null)}
      >
        Cookie preferences
      </button>
    );
  return (
    <section className="analytics-consent" aria-label="Analytics preferences">
      <div>
        <strong>A little insight helps us improve.</strong>
        <p>
          Allow Google Analytics to measure visits and website interactions,
          including phone-link clicks. Your choice won’t affect access to the
          site.
        </p>
      </div>
      <div>
        <button type="button" onClick={() => choose("denied")}>
          Essential only
        </button>
        <button type="button" onClick={() => choose("granted")}>
          Allow analytics
        </button>
      </div>
    </section>
  );
}
