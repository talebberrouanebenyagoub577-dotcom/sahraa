import { NextRequest } from "next/server";
import { z } from "zod";
import { ConfirmationState } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getTrustedClientIp } from "@/lib/fraud/ip";
import { emitConfirmedPurchase, syncOrderSheet } from "@/lib/fraud/purchase";
import { after } from "@/lib/http/after";

const bodySchema = z.object({
  action: z.enum(["accept", "reject"]),
  note: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth || !requireRole(auth, ADMIN_ROLES)) return apiError("Forbidden", 403);
    const { id } = await params;
    const { action, note } = bodySchema.parse(await request.json());
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return apiError("Order not found", 404);

    const accepted = action === "accept";
    const updated = await prisma.order.update({
      where: { id },
      data: {
        confirmationState: accepted ? ConfirmationState.CONFIRMED : ConfirmationState.REJECTED,
        status: accepted ? "CONFIRMED" : "CANCELLED",
        holdReason: accepted ? order.holdReason : note || order.holdReason || "رفض المشرف الطلب",
        confirmationNotes: note || order.confirmationNotes,
        statusHistory: {
          create: {
            status: accepted ? "CONFIRMED" : "CANCELLED",
            note: note || (accepted ? "Admin accepted the order" : "Admin rejected the order"),
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: accepted ? "fraud.accept" : "fraud.reject",
        entity: "Order",
        entityId: order.id,
        details: { note: note || "", orderNumber: order.orderNumber },
        ipAddress: getTrustedClientIp(request.headers),
      },
    });

    if (accepted) await emitConfirmedPurchase(order.id);
    after(() => syncOrderSheet(order.id, accepted));
    return apiSuccess({ id: updated.id, status: updated.status, confirmationState: updated.confirmationState });
  } catch (error) {
    return handleApiError(error);
  }
}
