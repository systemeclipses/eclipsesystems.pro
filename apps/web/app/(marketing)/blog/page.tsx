import type { Metadata } from "next";
import { BlogPostList } from "@/components/marketing/blog-post-list";
import { PublicCta, PublicPageHero } from "@/components/marketing/public-page";

export const metadata: Metadata = {
  title: "Blog",
  description: "Eclipse Systems writing on timekeeping, billing operations, shift management, and legal workflows."
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicPageHero
        compact
        eyebrow=""
        title="Ideas for Growing Teams."
        description="Blog posts on operations, customer workflows, billing habits, team coordination, and the small systems that help growing teams move with less drag."
        image="/media/generated/heroes/resources.jpg"
        imageAlt="An operations leader organizing workflow notes and diagrams"
        points={["Blog posts", "Growth ideas", "Better systems"]}
      />

      <section className="mx-auto max-w-[100rem] px-5 py-16 md:py-24">
        <BlogPostList />
      </section>
      <PublicCta eyebrow="Have a workflow worth fixing?" title="Let’s make the next version easier to run." primaryLabel="Schedule a Demo" primaryHref="/contact" />
    </main>
  );
}
