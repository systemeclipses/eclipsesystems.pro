import { redirect } from "next/navigation";
import { getActiveOrgId } from "@/lib/org";
import { createServerClient } from "@/lib/supabase/server";

export default async function SeoAdminPage() {
  await getActiveOrgId();
  const supabase = createServerClient();
  const { data: memberships } = await supabase.from("memberships").select("role").limit(1);
  const role = memberships?.[0]?.role;
  if (role !== "owner") redirect("/templates");

  const cards = [
    ["Indexation health", "Connect Google Search Console and Bing Webmaster APIs."],
    ["Top ranking queries", "Pull clicks, impressions, CTR, and average position."],
    ["AI citation tracker", "Run weekly prompts against ChatGPT and Perplexity APIs."],
    ["Backlink count", "Connect Moz, Ahrefs, or another backlink provider."],
    ["Core Web Vitals", "Pull PageSpeed Insights for top SEO URLs."]
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold">SEO Dashboard</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {cards.map(([title, body]) => (
          <section key={title} className="rounded-lg border border-border p-5">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
