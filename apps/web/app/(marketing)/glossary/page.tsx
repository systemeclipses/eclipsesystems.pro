import type { Metadata } from "next";
import Link from "next/link";
import { loadGlossary } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Timekeeping Glossary",
  description: "Definitions for timekeeping, billing, legal operations, shift management, and professional services terms."
};

export default async function GlossaryPage() {
  const terms = await loadGlossary();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Timekeeping Glossary</h1>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {terms.map((term) => <Link key={term.slug} href={`/glossary/${term.slug}`} className="rounded-lg border border-border p-4 hover:bg-muted/40"><h2 className="font-semibold">{term.term}</h2><p className="mt-1 text-sm text-muted-foreground">{term.definition}</p></Link>)}
      </div>
    </main>
  );
}
