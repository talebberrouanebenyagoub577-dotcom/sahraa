import { NextResponse } from "next/server";

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://sahraaaaaaaaaaa.shop";
  try {
    const host = new URL(origin).hostname;
    if (!host || host === "localhost") return undefined;
    return `.${host.startsWith("www.") ? host.slice(4) : host}`;
  } catch {
    return undefined;
  }
}

function cookieOptions(maxAge: number) {
  const domain = cookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && token.length < 4096 && parts.every((part) => part.length > 0);
}

export async function POST(request: Request) {
  let accessToken = "";
  try {
    const body = (await request.json()) as { accessToken?: unknown };
    accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (!looksLikeJwt(accessToken)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("access_token", accessToken, cookieOptions(60 * 15));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("access_token", "", cookieOptions(0));
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
