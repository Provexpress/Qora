import { NextRequest, NextResponse } from "next/server";
import { canAccessPath, getDefaultPathForRole } from "@/lib/permissions";
import { roleCookieName, sessionCookieName } from "@/lib/session";

const publicPaths = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(sessionCookieName)?.value;
  const role = request.cookies.get(roleCookieName)?.value;
  const isPublic = publicPaths.includes(pathname);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(session ? getDefaultPathForRole(role) : "/login", request.url));
  }

  if (!session && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && !role) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(sessionCookieName);
    response.cookies.delete(roleCookieName);
    return response;
  }

  if (session && isPublic) {
    return NextResponse.redirect(new URL(getDefaultPathForRole(role), request.url));
  }

  if (session && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultPathForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
