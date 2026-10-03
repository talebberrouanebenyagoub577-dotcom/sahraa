import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Unauthorized", 401);

    const page = parseInt(new URL(request.url).searchParams.get("page") || "1", 10);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 50,
        take: 50,
      }),
      prisma.auditLog.count(),
    ]);

    return apiSuccess({ logs, pagination: { page, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
