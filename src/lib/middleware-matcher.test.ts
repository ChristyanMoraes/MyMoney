import { describe, expect, it } from "vitest";
import { shouldRunAuthMiddleware } from "@/lib/middleware-matcher";

describe("shouldRunAuthMiddleware", () => {
  it("não corre para api/auth, _next e favicon", () => {
    expect(shouldRunAuthMiddleware("/api/auth/signin")).toBe(false);
    expect(shouldRunAuthMiddleware("/api/auth/callback/credentials")).toBe(false);
    expect(shouldRunAuthMiddleware("/_next/static/chunks/foo.js")).toBe(false);
    expect(shouldRunAuthMiddleware("/_next/image")).toBe(false);
    expect(shouldRunAuthMiddleware("/favicon.ico")).toBe(false);
  });

  it("corre para rotas da app", () => {
    expect(shouldRunAuthMiddleware("/")).toBe(true);
    expect(shouldRunAuthMiddleware("/dashboard")).toBe(true);
    expect(shouldRunAuthMiddleware("/login")).toBe(true);
  });
});
