import { StructuredData } from "./structured-data";

export type FaqItem = { question: string; answer: string };

export function FAQ({ items }: { items: FaqItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <section className="mt-16">
      <h2 className="font-title text-4xl leading-none text-[#172219]">Frequently Asked Questions</h2>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <details key={item.question} className="group rounded-[1rem] border border-[#d8d0c1] bg-[#fbfaf6] p-5 open:bg-[#eef1e5]">
            <summary className="cursor-pointer font-bold text-[#172219]">{item.question}</summary>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#314839]/70">{item.answer}</p>
          </details>
        ))}
      </div>
      <StructuredData schema={schema} />
    </section>
  );
}
