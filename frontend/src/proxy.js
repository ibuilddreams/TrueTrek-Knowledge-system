import { NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_ROLES } from "@/constants/auth";

const PROTECTED_PREFIXES = ["/dashboard"];

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE.SESSION)?.value;
  const backendUserCookie = request.cookies.get(AUTH_COOKIE.USER)?.value;

  if (!sessionCookie && !backendUserCookie) {
    const response = NextResponse.next();
    response.headers.set("x-ttl-auth", "anonymous");
    return response;
  }

  try {
    const session = JSON.parse(sessionCookie || backendUserCookie);
    const response = NextResponse.next();
    response.headers.set("x-ttl-auth", session?.role || AUTH_ROLES.GUEST);
    return response;
  } catch {
    const response = NextResponse.next();
    response.headers.set("x-ttl-auth", "invalid");
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/login"],
};
