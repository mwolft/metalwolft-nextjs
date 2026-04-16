import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPrivate =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/pedidos");

  if (!isPrivate) {
    return NextResponse.next();
  }

  // No leemos JWT, solo comprobamos que exista la cookie
  const hasAccessToken = request.cookies.has("access_token");

  if (!hasAccessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    console.info("[Middleware] Redirecting unauthenticated user to login.", {
      from: pathname,
      to: loginUrl.toString(),
    });
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
