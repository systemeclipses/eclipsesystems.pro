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
    <section className="mt-12 rounded-[1.25rem] border border-[#cbd3b0] bg-[#eef1e5] p-6">
      <p className="text-sm font-semibold">Reviewed by {name}</p>
      <p className="mt-2 text-sm font-semibold text-[#314839]/68">{role}. {expertise}</p>
      <StructuredData schema={schema} />
    </section>
  );
}
