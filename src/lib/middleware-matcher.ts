/**
 * Prefixos de pathname que o middleware do Next não deve interceptar.
 * Manter alinhado com `middleware.ts` → `config.matcher` (exclui api/auth, _next/*, favicon).
 */
export function shouldRunAuthMiddleware(pathname: string): boolean {
  if (pathname.startsWith("/api/auth")) return false;
  if (pathname.startsWith("/_next/static")) return false;
  if (pathname.startsWith("/_next/image")) return false;
  if (pathname === "/favicon.ico") return false;
  return true;
}
