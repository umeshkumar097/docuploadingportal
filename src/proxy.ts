import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

// Next.js 16 Proxy Convention
export function proxy(req: any) {
  return auth((req: any) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    if (nextUrl.pathname.startsWith("/dashboard")) {
      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
    }

    return;
  })(req);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
