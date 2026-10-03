import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { verifyAccessToken, getTokenFromHeader, JWTPayload } from "./jwt";

export interface AuthContext {
  user: JWTPayload;
}

export function getAuthFromRequest(
  request: NextRequest
): AuthContext | null {
  const token =
    getTokenFromHeader(request.headers.get("authorization")) ||
    request.cookies.get("access_token")?.value;

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
