import { describe, expect, it } from "vitest";
import { hasPlanFeature } from "@eclipsesystems/shared/plans";

describe("plan features", () => {
  it("gates features by plan", () => {
    expect(hasPlanFeature("starter", "projects")).toBe(false);
    expect(hasPlanFeature("pro", "invoicing")).toBe(true);
    expect(hasPlanFeature("business", "chat")).toBe(true);
    expect(hasPlanFeature("legal", "legal")).toBe(true);
  });
});
