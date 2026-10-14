import { NextRequest } from "next/server";
import { after } from "@/lib/http/after";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { OrderStatus } from "@prisma/client";
import { PRODUCT_UNIT_PRICE } from "@/lib/pricing";
import { appendOrderToGoogleSheet } from "@/lib/services/googleSheet";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = getAuthFromRequest(request);

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
        otp: { select: { delivery: true, verifiedAt: true } },
      },
    });

    if (!order) return apiError("Order not found", 404);

    const isAdmin = Boolean(auth && requireRole(auth, ADMIN_ROLES));
    if (auth && !isAdmin && order.userId !== auth.user.userId) {
      return apiError("Forbidden", 403);
    }

    if (!isAdmin) {
      const { clientIp: _clientIp, attribution: _attribution, deviceId: _deviceId, ...safe } = order;
      return apiSuccess(safe);
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
    const { id } = await params;
    const auth = getAuthFromRequest(request);
    const body = await request.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!order) return apiError("Order not found", 404);

    // Feature: Add Cross-Sell Product to existing order from Thank You Page
    if (body.addCrossSellProductId) {
      const product = await prisma.product.findUnique({
        where: { id: body.addCrossSellProductId, status: "APPROVED" },
        include: { images: { where: { isPrimary: true }, take: 1 } },
      });
      if (!product) return apiError("Product not found", 404);

      // Add line item at original price 199 SAR
      const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            sellerId: product.sellerId,
            name: product.name,
            nameAr: product.nameAr,
            sku: product.sku,
            price: PRODUCT_UNIT_PRICE,
            quantity: 1,
            total: PRODUCT_UNIT_PRICE,
          },
        });

        const newSubtotal = order.subtotal + PRODUCT_UNIT_PRICE;
        const newTotal = order.total + PRODUCT_UNIT_PRICE;

        const res = await tx.order.update({
          where: { id: order.id },
          data: {
            subtotal: newSubtotal,
            total: newTotal,
          },
          include: {
            items: {
              include: {
                product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              },
            },
            statusHistory: { orderBy: { createdAt: "desc" } },
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { soldCount: { increment: 1 } },
        });

        return res;
      });

      // Sync updated order to Google Sheet
      const shippingAddr = (order.shippingAddress as Record<string, unknown>) || {};
      const sheetItems = updatedOrder.items.map((item) => ({
        name: item.nameAr || item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const sheetPayload = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        createdAt: updatedOrder.createdAt.toISOString(),
        customerName: String(shippingAddr.firstName || "العميل"),
        customerPhone: String(shippingAddr.phone || ""),
        city: String(shippingAddr.city || "المملكة العربية السعودية"),
        items: sheetItems,
        hasUpsell: false,
        subtotal: updatedOrder.subtotal,
        discount: updatedOrder.discount,
        shipping: 0,
        total: updatedOrder.total,
        paymentMethod: "COD",
        status: updatedOrder.status,
      };
      after(() => appendOrderToGoogleSheet(sheetPayload, "order.updated"));

      return apiSuccess(updatedOrder);
    }

    // Standard Admin / Status updates
    if (!auth) return apiError("Unauthorized", 401);
    const userId = auth.user.userId;
    const isAdmin = requireRole(auth, ADMIN_ROLES);

    if (!isAdmin && order.userId !== userId) {
      return apiError("Forbidden", 403);
    }

    const { status, trackingNumber, note } = z
      .object({
        status: z.nativeEnum(OrderStatus).optional(),
        trackingNumber: z.string().optional(),
        note: z.string().optional(),
      })
      .parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (status === "DELIVERED") updateData.deliveredAt = new Date();

      const o = await tx.order.update({
        where: { id },
        data: updateData,
      });

      if (status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            note: note || `Status changed to ${status}`,
          },
        });
      }

      return o;
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
