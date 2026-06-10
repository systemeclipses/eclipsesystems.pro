import { describe, expect, it } from "vitest";
import { hasRoleAtLeast } from "@/lib/permissions";

describe("permissions", () => {
  it("orders member roles", () => {
    expect(hasRoleAtLeast("superuser", "owner")).toBe(true);
    expect(hasRoleAtLeast("owner", "admin")).toBe(true);
    expect(hasRoleAtLeast("manager", "admin")).toBe(false);
    expect(hasRoleAtLeast("member", "member")).toBe(true);
  });
});
