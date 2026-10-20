import { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import {
  ADMIN_ROLES,
  getAuthFromRequest,
  requireRole,
  type AuthContext,
} from "@/lib/auth/middleware";

export function requireAdmin(request: NextRequest): AuthContext | Response {
  const auth = getAuthFromRequest(request);
  if (!auth) return apiError("Unauthorized", 401);
  if (!requireRole(auth, ADMIN_ROLES)) return apiError("Forbidden", 403);
  return auth;
}

export function isAdminAuth(value: AuthContext | Response): value is AuthContext {
  return !(value instanceof Response);
}
