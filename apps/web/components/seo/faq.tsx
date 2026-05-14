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
    <section className="mt-12">
      <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <details key={item.question} className="group p-4">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
      <StructuredData schema={schema} />
    </section>
  );
}
