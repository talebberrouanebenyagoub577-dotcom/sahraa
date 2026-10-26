import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { z } from "zod";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where = { role: { in: ADMIN_ROLES } };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true, lastLoginAt: true,
          sellerProfile: { select: { storeName: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return apiSuccess({ users, pagination: { page, limit, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const { userId, role, isActive } = z.object({
      userId: z.string(),
      role: z.nativeEnum(UserRole).optional(),
      isActive: z.boolean().optional(),
    }).parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!existing || !ADMIN_ROLES.includes(existing.role)) return apiError("Not found", 404);
    if (role && !ADMIN_ROLES.includes(role)) return apiError("Forbidden", 403);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(role ? { role } : {}), ...(isActive !== undefined ? { isActive } : {}) },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth!.user.userId,
        action: "UPDATE_USER",
        entity: "User",
        entityId: userId,
        details: { role, isActive },
      },
    });

    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
