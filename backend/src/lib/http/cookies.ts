import type { NextResponse } from "next/server";

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  const origin = process.env.FRONTEND_ORIGIN || "https://sahraaaaaaaaaaa.shop";
  try {
    const host = new URL(origin).hostname;
    if (!host || host === "localhost") return undefined;
    const apex = host.startsWith("www.") ? host.slice(4) : host;
    return `.${apex}`;
  } catch {
    return undefined;
  }
}

export function authCookieOptions(maxAge: number) {
  const production = process.env.NODE_ENV === "production";
  const domain = cookieDomain();
  return {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export function setAuthCookie(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set("access_token", token, authCookieOptions(maxAge));
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set("access_token", "", authCookieOptions(0));
}
