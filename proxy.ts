import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/",
  "/jobs",
  "/recommendations",
  "/applications",
  "/resumes",
  "/analytics",
  "/companies",
  "/settings",
];

// Routes only accessible when NOT authenticated
const authRoutes = ["/signin", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      route === nextUrl.pathname ||
      (route !== "/" && nextUrl.pathname.startsWith(route))
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Redirect unauthenticated users to signin
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};