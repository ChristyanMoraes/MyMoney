/** Lógica espelhada em `middleware.ts` — manter alinhado com `callbacks.authorized`. */
export function isPathAuthorizedForMiddleware(token: unknown, pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") return true;
  return !!token;
}
