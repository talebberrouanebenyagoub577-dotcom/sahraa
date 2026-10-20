import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@/lib/constants";
import { dashboardPath, isDashboardHome, isStoreAdminRole } from "@/lib/auth/dashboard-path";
import { verifyAccessTokenEdge } from "@/lib/auth/edge-jwt";
const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: true,
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
});

const protectedRoutes = ["/dashboard", "/checkout", "/order/"];

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const SELLER_ROLES = ["SELLER", "SUPER_ADMIN", "ADMIN"];

function getPathWithoutLocale(pathname: string) {
  const localePattern = new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})`);
  return pathname.replace(localePattern, "") || "/";
}

function getLocale(pathname: string) {
  const match = pathname.match(new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})`));
  return match?.[1] || DEFAULT_LOCALE;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  const response = intlMiddleware(request);
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const locale = getLocale(pathname);
  const token = request.cookies.get("access_token")?.value;
  const payload = token ? verifyAccessTokenEdge(token) : null;

  const isOrderSuccess = pathWithoutLocale.startsWith("/order/success");
  const isProtected = protectedRoutes.some((r) => pathWithoutLocale.startsWith(r));
  if (isProtected && !isOrderSuccess && !payload) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (isDashboardHome(pathWithoutLocale) && payload) {
    return NextResponse.redirect(new URL(dashboardPath(locale, payload.role), request.url));
  }

  if (pathWithoutLocale.startsWith("/dashboard/customer") && payload && isStoreAdminRole(payload.role)) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/admin`, request.url));
  }

  if (pathWithoutLocale.startsWith("/dashboard/admin") && payload) {
    if (!ADMIN_ROLES.includes(payload.role)) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard/customer`, request.url));
    }
  }

  if (pathWithoutLocale.startsWith("/dashboard/seller") && payload) {
    if (!SELLER_ROLES.includes(payload.role)) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard/customer`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|favicon.ico|manifest.json|sw.js|icons).*)"],
};
