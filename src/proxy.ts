import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Optimistic guard only — it keeps unauthenticated users out of the UI.
 * requireSession() inside each server action is the real boundary.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = new URL("/login", request.url);
    if (request.nextUrl.pathname !== "/") {
      url.searchParams.set("from", request.nextUrl.pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything and subtract, so a new route is protected by default.
  // Enumerating protected paths fails open the moment someone adds one.
  matcher: [
    "/((?!login|_next/static|_next/image|images|favicon.ico|robots.txt).*)",
  ],
};
