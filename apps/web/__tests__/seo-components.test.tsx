import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FAQ } from "@/components/seo/faq";
import { ComparisonTable } from "@/components/seo/comparison-table";

describe("seo components", () => {
  it("renders FAQ content and JSON-LD", () => {
    render(<FAQ items={[{ question: "What is Eclipse Timekeeping?", answer: "A timekeeping SaaS by Eclipse Systems." }]} />);
    expect(screen.getByText("What is Eclipse Timekeeping?")).toBeTruthy();
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain("FAQPage");
  });

  it("renders semantic comparison tables", () => {
    render(
      <ComparisonTable
        caption="Comparison"
        columns={[{ key: "eclipse", label: "Eclipse Timekeeping" }]}
        rows={[{ label: "Pricing", cells: { eclipse: "$10 per seat per month" } }]}
      />
    );
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByText("Eclipse Timekeeping")).toBeTruthy();
  });
});
