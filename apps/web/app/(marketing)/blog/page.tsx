import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Eclipse Systems writing on timekeeping, billing operations, shift management, and legal workflows."
};

export default function BlogPage() {
  return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-3xl font-semibold">Blog</h1><p className="mt-4 text-muted-foreground">Articles will publish here after editorial review.</p></main>;
}
