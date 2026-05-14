import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guides",
  description: "Evergreen guides for timekeeping, billable hours, LEDES, UTBMS, trust accounting, and shift policies."
};

export default function GuidesPage() {
  return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-semibold">Guides</h1><p className="mt-4 text-muted-foreground">Flagship guides are planned for SME review before publication.</p></main>;
}
