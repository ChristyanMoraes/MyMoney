import { withAuth } from "next-auth/middleware";
import { isPathAuthorizedForMiddleware } from "@/lib/middleware-authorized";

export default withAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token, req }) =>
      isPathAuthorizedForMiddleware(token, req.nextUrl.pathname),
  },
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
