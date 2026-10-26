import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { verifyAccessToken, getTokenFromHeader, JWTPayload } from "./jwt";

export interface AuthContext {
  user: JWTPayload;
}

function tokenFromCookieHeader(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith("access_token=")) continue;
    const value = trimmed.slice("access_token=".length);
    if (!value) continue;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export function getAuthFromRequest(
  request: NextRequest
): AuthContext | null {
  const token =
    getTokenFromHeader(request.headers.get("authorization")) ||
    request.cookies.get("access_token")?.value ||
    tokenFromCookieHeader(request.headers.get("cookie"));

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return { user: payload };
}

export function requireRole(
  auth: AuthContext | null,
  roles: UserRole[]
): boolean {
  if (!auth) return false;
  return roles.includes(auth.user.role);
}

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
];

export const SELLER_ROLES: UserRole[] = [
  UserRole.SELLER,
  ...ADMIN_ROLES,
];

export const STAFF_ROLES: UserRole[] = [
  UserRole.SUPPORT_AGENT,
  ...ADMIN_ROLES,
];
