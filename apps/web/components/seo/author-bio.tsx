import { StructuredData } from "./structured-data";

export function AuthorBio({ name, role, expertise, links = [] }: { name: string; role: string; expertise: string; links?: string[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: role,
    description: expertise,
    sameAs: links
  };

  return (
    <section className="mt-12 rounded-lg border border-border p-5">
      <p className="text-sm font-semibold">Reviewed by {name}</p>
      <p className="mt-2 text-sm text-muted-foreground">{role}. {expertise}</p>
      <StructuredData schema={schema} />
    </section>
  );
}
