import { auth } from "@/auth";

// Next.js 16 Proxy Convention using the unified Auth instance
export const proxy = auth((req: any) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Protect dashboard routes
  if (nextUrl.pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      console.log("Unauthenticated access to dashboard. Redirecting to /login.");
      return Response.redirect(new URL("/login", nextUrl));
    }
  }

  // Redirect logged-in users away from the login page
  if (nextUrl.pathname.startsWith("/login")) {
    if (isLoggedIn) {
      console.log("Authenticated user on login page. Redirecting to /dashboard.");
      return Response.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
