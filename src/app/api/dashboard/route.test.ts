import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/dashboard/route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    financialGoal: {
      findMany: vi.fn(),
    },
  },
}));

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    vi.mocked(prisma.transaction.findMany).mockReset();
    vi.mocked(prisma.transaction.aggregate).mockReset();
    vi.mocked(prisma.financialGoal.findMany).mockReset();
  });

  it("401 sem sessão", async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/dashboard"));
    expect(res.status).toBe(401);
  });

  it("401 sem user.id na sessão", async () => {
    vi.mocked(auth).mockResolvedValue({ user: {} } as ReturnType<typeof auth> extends Promise<infer S> ? S : never);
    const res = await GET(new Request("http://localhost/api/dashboard"));
    expect(res.status).toBe(401);
  });

  it("200 com chaves esperadas no JSON", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", name: "T", email: "t@test.com" },
    } as Awaited<ReturnType<typeof auth>>);

    vi.mocked(prisma.transaction.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
      _sum: { amount: null },
    } as Awaited<ReturnType<typeof prisma.transaction.aggregate>>);
    vi.mocked(prisma.financialGoal.findMany).mockResolvedValue([]);

    const res = await GET(
      new Request("http://localhost/api/dashboard?month=3&year=2026"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toMatchObject({
      balance: 0,
      income: 0,
      expenses: 0,
      result: 0,
    });
    expect(body.categoryRanking).toEqual([]);
    expect(Array.isArray(body.dailyData)).toBe(true);
    expect(body.transactions).toEqual([]);
    expect(body.goals).toEqual([]);
    expect(body.fixedExpenses).toBe(0);
  });
});
