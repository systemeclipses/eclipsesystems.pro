import type { Thing, WithContext } from "schema-dts";

export type JsonLd<T extends Thing> = WithContext<T> | (T & { "@context": "https://schema.org" });

export function StructuredData<T extends Thing>({ schema }: { schema: JsonLd<T> | Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  );
}
