import { NextResponse, type NextRequest } from "next/server";
import { getFeatureFlags } from "@/platform/core/flags";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/auth/session-token";

/**
 * Next.js 16 Proxy — protects committee routes with the signed session cookie.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login" || pathname.startsWith("/login/");
  const { dashboardAuthRequired } = getFeatureFlags();

  if (!dashboardAuthRequired) {
    return NextResponse.next();
  }

  const userId = await readSessionUserId(request.cookies.get(SESSION_COOKIE)?.value);

  if (isDashboard && !userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLogin && userId && request.nextUrl.searchParams.get("access") !== "denied") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/login/:path*"],
};
