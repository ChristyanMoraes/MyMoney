import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/auth/register/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findFirst).mockReset();
    vi.mocked(prisma.user.create).mockReset();
    vi.mocked(bcrypt.hash).mockReset();
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
  });

  it("400 quando Zod falha", async () => {
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", email: "invalid", password: "123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("400 quando email já existe", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "existing",
    } as Awaited<ReturnType<typeof prisma.user.findFirst>>);
    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "dup@test.com",
        password: "secret12",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("cadastrado");
  });

  it("201 e corpo com id quando cria utilizador", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-id",
      name: "Novo",
      email: "novo@test.com",
      password: "hashed-password",
      whatsapp: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Awaited<ReturnType<typeof prisma.user.create>>);

    const req = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Novo",
        email: "Novo@Test.com",
        password: "secret12",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      id: "new-id",
      name: "Novo",
      email: "novo@test.com",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("secret12", 12);
  });
});
