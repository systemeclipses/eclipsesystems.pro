import { describe, expect, it } from "vitest";
import { centsToDollars, dollarsToCents } from "@/lib/money";

describe("money", () => {
  it("round-trips cents and dollar strings", () => {
    expect(centsToDollars(1000)).toBe("10.00");
    expect(dollarsToCents("10.00")).toBe(1000);
    expect(centsToDollars(-50)).toBe("-0.50");
  });

  it("rejects fractional cents", () => {
    expect(() => dollarsToCents("1.001")).toThrow();
  });
});
