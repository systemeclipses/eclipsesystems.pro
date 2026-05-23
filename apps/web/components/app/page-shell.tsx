import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="overflow-hidden rounded-md bg-primary p-6 text-white md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-semibold text-secondary">{eyebrow}</p>
          <h1 className="mt-4 font-title text-5xl leading-[0.9] text-cream md:text-7xl">{title}</h1>
          {description ? <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75 md:text-base">{description}</p> : null}
        </div>
        {action ? (
          <Link href={action.href} className="inline-flex h-11 items-center gap-2 rounded-md bg-cream px-4 text-sm font-semibold text-primary hover:bg-white">
            {action.label} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-md border border-border bg-white/65 p-5 ${className}`}>{children}</section>;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-border bg-cream/60 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-sm bg-secondary text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? (
        <Link href={action.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-white/65 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}
