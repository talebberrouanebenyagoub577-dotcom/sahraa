import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const userId = auth.user.userId;
    const isAdmin = requireRole(auth, ADMIN_ROLES);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            seller: { select: { storeName: true, storeNameAr: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: "desc" } },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!order) return apiError("Order not found", 404);
    if (!isAdmin && order.userId !== userId) {
      return apiError("Forbidden", 403);
    }

    return apiSuccess(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { id } = await params;
    const body = z
      .object({
        status: z.nativeEnum(OrderStatus).optional(),
        trackingNumber: z.string().optional(),
        note: z.string().optional(),
      })
      .parse(await request.json());

    const userId = auth.user.userId;
    const isAdmin = requireRole(auth, ADMIN_ROLES);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return apiError("Order not found", 404);

    if (!isAdmin && order.userId !== userId) {
      return apiError("Forbidden", 403);
    }

    if (!isAdmin && body.status && body.status !== "CANCELLED") {
      return apiError("Customers can only cancel orders", 403);
    }

    if (!isAdmin && body.status === "CANCELLED" && !["PENDING", "CONFIRMED"].includes(order.status)) {
      return apiError("Cannot cancel this order", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.trackingNumber ? { trackingNumber: body.trackingNumber } : {}),
        },
        include: { items: true, statusHistory: true },
      });

      if (body.status) {
        await tx.orderStatusHistory.create({
          data: { orderId: id, status: body.status, note: body.note },
        });

        await tx.notification.create({
          data: {
            userId: order.userId,
            title: "Order Updated",
            titleAr: "تحديث الطلب",
            message: `Order ${order.orderNumber} is now ${body.status}`,
            messageAr: `طلبك رقم ${order.orderNumber} أصبح ${body.status}`,
            type: "order",
            link: `/dashboard/customer/orders/${id}`,
          },
        });
      }

      return result;
    });

    if (isAdmin) {
      await prisma.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "UPDATE_ORDER",
          entity: "Order",
          entityId: id,
          details: body,
        },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
