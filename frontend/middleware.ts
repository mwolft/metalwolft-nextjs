import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPrivate =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/pedidos");

  if (!isPrivate) {
    return NextResponse.next();
  }

  // No leemos JWT, solo comprobamos que exista la cookie
  const hasAccessToken = request.cookies.has("access_token");

  if (!hasAccessToken) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}
