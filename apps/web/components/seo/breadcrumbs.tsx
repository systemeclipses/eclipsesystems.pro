import Link from "next/link";
import { absoluteUrl } from "@/lib/seo/content";
import { StructuredData } from "./structured-data";

export type BreadcrumbItem = { name: string; href: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href)
    }))
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6 text-sm font-semibold text-[#314839]/58">
        <ol className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="flex gap-2">
              {index > 0 ? <span className="text-[#b4c292]">/</span> : null}
              <Link className="hover:text-[#172219]" href={item.href}>{item.name}</Link>
            </li>
          ))}
        </ol>
      </nav>
      <StructuredData schema={schema} />
    </>
  );
}
