import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) {
      return apiError("Unauthorized", 401);
    }

    const [totalOrders, totalUsers, totalProducts, salesAgg] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count({ where: { status: "APPROVED" } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["DELIVERED", "CONFIRMED", "SHIPPED"] } },
      }),
    ]);

    return apiSuccess({
      totalSales: salesAgg._sum.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
