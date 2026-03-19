import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return Response.redirect(new URL("/api/auth/signin", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
