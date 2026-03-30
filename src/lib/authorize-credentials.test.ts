import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials } from "@/lib/authorize-credentials";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe("authorizeCredentials", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findFirst).mockReset();
    vi.mocked(bcrypt.compare).mockReset();
  });

  it("retorna null sem credenciais", async () => {
    expect(await authorizeCredentials(null)).toBeNull();
    expect(await authorizeCredentials(undefined)).toBeNull();
  });

  it("retorna null com email ou senha vazios após trim", async () => {
    expect(
      await authorizeCredentials({ email: "   ", password: "x" }),
    ).toBeNull();
    expect(await authorizeCredentials({ email: "a@b.com", password: "" })).toBeNull();
  });

  it("retorna null se utilizador não existir", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    expect(
      await authorizeCredentials({ email: "nope@test.com", password: "secret12" }),
    ).toBeNull();
    expect(prisma.user.findFirst).toHaveBeenCalled();
  });

  it("retorna null se senha não confere", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "u1",
      name: "U",
      email: "u@test.com",
      password: "hash",
      image: null,
    } as Awaited<ReturnType<typeof prisma.user.findFirst>>);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    expect(
      await authorizeCredentials({ email: "u@test.com", password: "wrong" }),
    ).toBeNull();
  });

  it("retorna utilizador quando credenciais estão corretas", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "user@test.com",
      password: "hash",
      image: null,
    } as Awaited<ReturnType<typeof prisma.user.findFirst>>);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const result = await authorizeCredentials({
      email: "User@Test.com",
      password: "okpassword",
    });
    expect(result).toEqual({
      id: "u1",
      name: "User",
      email: "user@test.com",
      image: null,
    });
  });
});
