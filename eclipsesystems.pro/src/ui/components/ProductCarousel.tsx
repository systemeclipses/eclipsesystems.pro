import { useEffect, useMemo, useState } from "react";
import { SoftwarePreview } from "./SoftwarePreview";

const slides = [
  {
    kind: "timekeeping",
    product: "Eclipse Timekeeping",
    line: "Time records that stay clean from clock-in to approval.",
    details: ["Live timers", "Timesheets", "Manager approvals", "Export-ready reporting"]
  },
  {
    kind: "mission",
    product: "Mission Command by Eclipse",
    line: "Coverage, chat, drops, and swaps in one operational view.",
    details: ["Shift marketplace", "Swap approvals", "Team chat", "Coverage visibility"]
  },
  {
    kind: "eclipse",
    product: "Eclipse",
    line: "Project time becomes client-ready invoices without retyping work.",
    details: ["Clients", "Projects", "Tasks", "Invoices and PDFs"]
  },
  {
    kind: "legal",
    product: "Eclipse Legal Add-on",
    line: "Matter-aware billing controls only when a firm needs them.",
    details: ["Matters", "UTBMS", "LEDES", "Trust ledger"]
  }
] as const;

export function ProductCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const prefersReducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion]);

  return (
    <section className="product-carousel" aria-labelledby="carousel-title">
      <div className="carousel-copy">
        <p className="eyebrow">Live product tour</p>
        <h2 id="carousel-title">{activeSlide.product}</h2>
        <p>{activeSlide.line}</p>
        <ul>
          {activeSlide.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <div className="carousel-controls" aria-label="Product carousel controls">
          {slides.map((slide, index) => (
            <button
              key={slide.product}
              type="button"
              aria-label={`Show ${slide.product}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <span />
            </button>
          ))}
        </div>
      </div>
      <div className="carousel-preview" aria-live="polite">
        <SoftwarePreview kind={activeSlide.kind} title={activeSlide.product} />
      </div>
    </section>
  );
}
