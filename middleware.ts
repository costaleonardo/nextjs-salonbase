import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes
  const publicRoutes = ["/login", "/signup", "/book"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If accessing a protected route without authentication
  if (!isPublicRoute && !isAuthenticated) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access login/signup, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based access control for dashboard
  if (pathname.startsWith("/dashboard")) {
    const userRole = req.auth?.user?.role;

    // Only OWNER and STAFF can access dashboard
    if (userRole !== "OWNER" && userRole !== "STAFF") {
      return NextResponse.redirect(new URL("/portal", req.url));
    }
  }

  // Only OWNER can access staff management
  if (pathname.startsWith("/dashboard/staff")) {
    const userRole = req.auth?.user?.role;

    if (userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
