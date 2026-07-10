import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ReactNode } from "react";

export function PublicPageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  points = [],
  actions,
  compact = false,
  height = compact ? "compact" : "default",
  titleTopClassName = "mt-4"
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  points?: readonly string[];
  actions?: ReactNode;
  compact?: boolean;
  height?: "compact" | "medium" | "default";
  titleTopClassName?: string;
}) {
  const heroHeight = height === "compact" ? "min-h-[min(58vh,34rem)]" : height === "medium" ? "min-h-[min(61vh,36.5rem)]" : "min-h-[min(74vh,46rem)]";

  return (
    <section data-public-hero-shell className="px-3 pt-3">
      <div data-public-hero className={`relative ${heroHeight} overflow-hidden rounded-[2rem] border border-white/10 bg-[#172219] text-[#f9e8d2] shadow-2xl shadow-black/25`}>
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover object-[68%_center] md:object-center" />
        <div className="absolute inset-0 bg-[#0b140e]/86" />
        <div className={`relative z-10 mx-auto flex ${heroHeight} max-w-[100rem] flex-col justify-end px-6 py-12 md:px-10 ${compact ? "md:py-12" : "md:py-16"} lg:px-14`}>
          {eyebrow ? <p className="text-sm font-bold text-[#c7d6a5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{eyebrow}</p> : null}
          <h1 className={`${titleTopClassName} max-w-6xl font-title text-5xl leading-[0.87] text-[#f9e8d2] drop-shadow-[0_6px_24px_rgba(0,0,0,0.72)] sm:text-6xl md:text-[5.1rem] md:leading-[0.84] lg:text-[5.8rem] xl:text-[6.55rem] 2xl:text-[7.2rem]`}>
            {title}
          </h1>
          <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-3xl text-base font-semibold leading-7 text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] md:text-lg">{description}</p>
            {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
          </div>
          {points.length ? (
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#f9e8d2]/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {points.map((point) => (
                <span key={point} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#b4c292]" />
                  {point}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function PublicSectionHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto grid max-w-5xl justify-items-center text-center" : "max-w-5xl"}>
      <p className="text-sm font-bold text-[#314839]">{eyebrow}</p>
      <h2 className="mt-3 font-title text-[clamp(3.2rem,5.8vw,7rem)] leading-[0.88] text-[#172219]">{title}</h2>
      {description ? (
        <p className="mt-6 max-w-3xl text-base font-semibold leading-7 text-[#314839]/72 md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}

export function PublicCta({
  eyebrow,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  eyebrow: string;
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="px-3 pb-14">
      <div className="mx-auto grid max-w-[100rem] gap-8 rounded-[2rem] bg-[#314839] px-7 py-10 text-[#f9e8d2] shadow-2xl shadow-[#172219]/15 md:px-12 md:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-bold text-[#b4c292]">{eyebrow}</p>
          <h2 className="mt-3 max-w-5xl font-title text-[clamp(3.2rem,5.3vw,6.5rem)] leading-[0.88]">{title}</h2>
          {description ? <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/68">{description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {secondaryLabel && secondaryHref ? (
            <Link href={secondaryHref} className="inline-flex items-center gap-2 rounded-full border border-[#f9e8d2]/35 px-6 py-3 text-sm font-bold text-[#f9e8d2] transition hover:bg-white/10">
              {secondaryLabel}
            </Link>
          ) : null}
          <Link href={primaryHref} className="inline-flex items-center gap-2 rounded-full bg-[#f9e8d2] px-6 py-3 text-sm font-bold text-[#314839] transition hover:bg-white">
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PublicDivider() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-5xl px-5 py-6">
      <div className="h-1 w-full bg-[linear-gradient(90deg,transparent_0%,#314839_16%,#314839_84%,transparent_100%)]" />
    </div>
  );
}
