import { describe, expect, it } from "vitest";
import { hasPlanFeature } from "@eclipsesystems/shared/plans";

describe("plan features", () => {
  it("gates features by plan", () => {
    expect(hasPlanFeature("timekeeping", "projects")).toBe(false);
    expect(hasPlanFeature("eclipse", "invoicing")).toBe(true);
    expect(hasPlanFeature("mission_command", "chat")).toBe(true);
    expect(hasPlanFeature("suite", "legal")).toBe(false);
    expect(hasPlanFeature("legal_addon", "legal")).toBe(true);
  });
});
