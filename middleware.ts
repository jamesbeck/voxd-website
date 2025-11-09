import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0]; // Remove port if present

  // Create response
  let response: NextResponse;

  // Allowed domains that don't redirect
  const allowedDomains = ["voxd.ai", "localhost"];

  // Paths that are always allowed (login and admin)
  const isLoginPath = request.nextUrl.pathname.startsWith("/login");
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  // Only redirect GET requests for tenant domains
  const shouldRedirect =
    !allowedDomains.includes(domain) && // Not an allowed domain
    request.method === "GET" && // Only GET requests
    !isLoginPath && // Not already on login
    !isAdminPath; // Not on admin

  if (shouldRedirect) {
    const loginUrl = new URL("/login", request.url);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  // Add custom header with the domain
  response.headers.set("x-domain", domain);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
};
