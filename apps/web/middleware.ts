import { NextResponse, type NextMiddleware } from "next/server";

import { auth, getAuthorizedRoute, hasAccessToRoute } from "@/lib/auth";
import { REDIRECT_AUTHORIZED, REDIRECT_UNAUTHORIZED } from "@/lib/consts";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};

const middleware: NextMiddleware = auth(async (req) => {
  const pathname = req.nextUrl.pathname;
  if (
    pathname === REDIRECT_UNAUTHORIZED ||
    (pathname === REDIRECT_AUTHORIZED && req.auth?.accessToken)
  ) {
    return NextResponse.next();
  }

  const authorizedPattern = getAuthorizedRoute(pathname);
  const isProtectedRoute = Boolean(authorizedPattern);
  console.log("isProtectedRoute", isProtectedRoute);
  const isUnauthorized =
    isProtectedRoute &&
    (!req.auth?.accessToken ||
      !hasAccessToRoute(authorizedPattern!, req.auth.accessToken));
  console.log("isUnauthorized", isUnauthorized);
  if (isUnauthorized) {
    return NextResponse.redirect(new URL(REDIRECT_UNAUTHORIZED, req.url));
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export default middleware;
