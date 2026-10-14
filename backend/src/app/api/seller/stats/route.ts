import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, SELLER_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, SELLER_ROLES)) return apiError("Unauthorized", 401);

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: auth!.user.userId },
    });
    if (!seller) return apiError("Seller profile not found", 404);

    const [productCount, orderStats, revenue, inventoryItems] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id } }),
      prisma.orderItem.groupBy({
        by: ["orderId"],
        where: { sellerId: seller.id },
        _count: true,
      }),
      prisma.orderItem.aggregate({
        where: { sellerId: seller.id },
        _sum: { total: true },
      }),
      prisma.inventory.findMany({
        where: { product: { sellerId: seller.id } },
        select: { quantity: true, lowStockAlert: true },
      }),
    ]);

    const lowStock = inventoryItems.filter((i) => i.quantity <= i.lowStockAlert).length;

    const pendingOrders = await prisma.orderItem.count({
      where: {
        sellerId: seller.id,
        order: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } },
      },
    });

    return apiSuccess({
      totalProducts: productCount,
      totalOrders: orderStats.length,
      pendingOrders,
      totalRevenue: revenue._sum.total || 0,
      lowStockItems: lowStock,
      storeRating: seller.rating,
      totalSales: seller.totalSales,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
