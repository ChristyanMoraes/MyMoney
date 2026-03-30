import { describe, expect, it } from "vitest";
import { isPathAuthorizedForMiddleware } from "@/lib/middleware-authorized";

describe("isPathAuthorizedForMiddleware", () => {
  it("permite /, /login e /register sem token", () => {
    expect(isPathAuthorizedForMiddleware(null, "/")).toBe(true);
    expect(isPathAuthorizedForMiddleware(undefined, "/login")).toBe(true);
    expect(isPathAuthorizedForMiddleware(null, "/register")).toBe(true);
  });

  it("exige token para /dashboard", () => {
    expect(isPathAuthorizedForMiddleware(null, "/dashboard")).toBe(false);
    expect(isPathAuthorizedForMiddleware({}, "/dashboard")).toBe(true);
  });
});
