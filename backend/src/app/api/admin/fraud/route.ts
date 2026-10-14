import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "••••";
  return `${digits.slice(0, 4)}••••${digits.slice(-2)}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!requireRole(auth, ADMIN_ROLES)) return apiError("Forbidden", 403);

    const [total, grouped, review, blocked, suspicious] = await Promise.all([
      prisma.order.count(),
      prisma.order.groupBy({ by: ["status"], _count: true }),
      prisma.order.count({ where: { confirmationState: "REVIEW" } }),
      prisma.fraudAttempt.count(),
      prisma.order.findMany({
        where: { OR: [{ riskLevel: { in: ["MEDIUM", "HIGH"] } }, { confirmationState: "REVIEW" }] },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          confirmationState: true,
          riskLevel: true,
          riskScore: true,
          riskReasons: true,
          holdReason: true,
          phoneE164: true,
          geoCountry: true,
          total: true,
          createdAt: true,
          shippingAddress: true,
        },
      }),
    ]);

    const count = (status: string) => grouped.find((row) => row.status === status)?._count || 0;
    const confirmed = count("CONFIRMED") + count("PROCESSING") + count("SHIPPED") + count("OUT_FOR_DELIVERY") + count("DELIVERED");

    return apiSuccess({
      stats: {
        total,
        blocked,
        review,
        confirmed,
        delivered: count("DELIVERED"),
        cancelled: count("CANCELLED"),
        returned: count("RETURNED"),
        confirmationRate: total ? Math.round((confirmed / total) * 100) : 0,
        deliveryRate: total ? Math.round((count("DELIVERED") / total) * 100) : 0,
        cancelRate: total ? Math.round((count("CANCELLED") / total) * 100) : 0,
        returnRate: total ? Math.round((count("RETURNED") / total) * 100) : 0,
      },
      orders: suspicious.map((order) => {
        const address = (order.shippingAddress as { country?: string; city?: string }) || {};
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          confirmationState: order.confirmationState,
          riskLevel: order.riskLevel,
          riskScore: order.riskScore,
          reasons: order.riskReasons,
          holdReason: order.holdReason,
          phone: maskPhone(order.phoneE164),
          country: address.country || "SA",
          city: address.city || "",
          geoCountry: order.geoCountry,
          total: order.total,
          createdAt: order.createdAt,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
