import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";

const publicPaths = ["/login", "/api/auth", "/api/health", "/api/projects-bypass", "/api/test", "/diagnostic", "/api/diagnostic", "/api/init-test-user", "/api/db-migrate"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Laisser passer les routes publiques
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Vérifier le token
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    // Rediriger vers le login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Vérifier que le token est valide (optionnel, pour plus de sécurité)
  // const payload = await verifyToken(token);
  // if (!payload) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
