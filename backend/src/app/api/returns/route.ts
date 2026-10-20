import { NextRequest } from "next/server";
import { ReturnShippingBearer } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { getSiteSettings } from "@/lib/settings";
import { calculateReturnRefund, claimedQuantityByOrderItem } from "@/lib/returns/refund";
import { notifyReturnStatus } from "@/lib/returns/notify";
import { customerPhone, hideInternalNotes, returnInclude } from "@/lib/returns/include";
import { z } from "zod";

const createSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  images: z.array(z.string().min(1)).max(8).optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);
    if (requireRole(auth, ADMIN_ROLES)) {
      return apiError("Use /api/admin/returns", 400);
    }

    const returns = await prisma.returnRequest.findMany({
      where: { userId: auth.user.userId },
      include: returnInclude,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(returns.map((row) => hideInternalNotes(row, false)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);
    if (requireRole(auth, ADMIN_ROLES)) return apiError("Forbidden", 403);

    const data = createSchema.parse(await request.json());
    const settings = await getSiteSettings();
    const windowDays = settings.returnWindowDays;
    const defaultCost = settings.returnShippingCostDefault;
    const defaultBearer =
      settings.returnShippingBearer === "STORE" ? ReturnShippingBearer.STORE : ReturnShippingBearer.CUSTOMER;
    const deductShipping = settings.returnDeductShipping;

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: {
          items: true,
          returnRequests: { include: { items: true } },
        },
      });
      if (!order || order.userId !== auth.user.userId) {
        throw Object.assign(new Error("Order not found"), { status: 404 });
      }
      if (order.status !== "DELIVERED") {
        throw Object.assign(new Error("Only delivered orders can be returned"), { status: 400 });
      }

      const origin = order.deliveredAt || order.createdAt;
      const windowMs = windowDays * 24 * 60 * 60 * 1000;
      if (Date.now() - origin.getTime() > windowMs) {
        throw Object.assign(new Error("Return window has expired"), { status: 400 });
      }

      const claimed = claimedQuantityByOrderItem(order.returnRequests);
      const lines = data.items.map((item) => {
        const orderItem = order.items.find((row) => row.id === item.orderItemId);
        if (!orderItem) {
          throw Object.assign(new Error("Item is not part of this order"), { status: 400 });
        }
        const remaining = orderItem.quantity - (claimed.get(orderItem.id) || 0);
        if (item.quantity > remaining) {
          throw Object.assign(new Error("Requested quantity exceeds returnable quantity"), { status: 400 });
        }
        return {
          orderItemId: orderItem.id,
          productId: orderItem.productId,
          name: orderItem.name,
          nameAr: orderItem.nameAr,
          sku: orderItem.sku,
          unitPrice: orderItem.price,
          quantity: item.quantity,
          lineTotal: Math.round(orderItem.price * item.quantity * 100) / 100,
        };
      });

      const goodsAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const breakdown = calculateReturnRefund({
        goodsAmount,
        returnShippingCost: defaultCost,
        shippingBearer: defaultBearer,
        deductShipping,
        approved: false,
      });

      const row = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          userId: auth.user.userId,
          reason: data.reason,
          description: data.description,
          images: data.images ?? [],
          status: "PENDING_REVIEW",
          goodsAmount: breakdown.goodsAmount,
          returnShippingCost: breakdown.returnShippingCost,
          shippingBearer: defaultBearer,
          deductShipping,
          shippingDeducted: breakdown.shippingDeducted,
          refundAmount: breakdown.refundAmount,
          items: { create: lines },
        },
        include: returnInclude,
      });

      await notifyReturnStatus(tx, {
        userId: auth.user.userId,
        returnId: row.id,
        status: "PENDING_REVIEW",
      });
      return row;
    });

    return apiSuccess(
      {
        ...hideInternalNotes(created, false),
        customerPhone: customerPhone(created.user, created.order.shippingAddress),
      },
      201,
    );
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 0;
    if (status && error instanceof Error) return apiError(error.message, status);
    return handleApiError(error);
  }
}
