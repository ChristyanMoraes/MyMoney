import { describe, expect, it } from "vitest";
import { getDashboardMonthUtcRange } from "@/lib/dashboard-month-range";

describe("getDashboardMonthUtcRange", () => {
  it("março 2026: início do mês em UTC", () => {
    const { dateFilter } = getDashboardMonthUtcRange(3, 2026);
    expect(dateFilter.gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(dateFilter.lt.toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("janeiro: mês anterior é dezembro do ano anterior", () => {
    const { prevDateFilter } = getDashboardMonthUtcRange(1, 2026);
    expect(prevDateFilter.gte.toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(prevDateFilter.lt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("endOfMonth tem último dia do mês corrente", () => {
    const { endOfMonth } = getDashboardMonthUtcRange(2, 2026);
    expect(endOfMonth.getUTCDate()).toBe(28);
    expect(endOfMonth.getUTCMonth()).toBe(1);
  });
});
