import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 Proxy Convention using NextAuth v5 wrapper
export const proxy = auth((req: any) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/login", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
