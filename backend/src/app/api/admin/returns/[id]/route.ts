import { NextRequest } from "next/server";
import { ReturnShippingBearer, ReturnStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isAdminAuth, requireAdmin } from "@/lib/auth/require-admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { calculateReturnRefund, canRecordManualRefund } from "@/lib/returns/refund";
import { notifyReturnStatus } from "@/lib/returns/notify";
import { customerPhone, returnInclude } from "@/lib/returns/include";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "awaiting_receipt",
    "received",
    "record_refund",
    "complete",
    "update_costs",
  ]),
  adminReason: z.string().max(500).optional(),
  internalNotes: z.string().max(2000).optional(),
  returnShippingCost: z.number().min(0).optional(),
  shippingBearer: z.enum(["CUSTOMER", "STORE"]).optional(),
  deductShipping: z.boolean().optional(),
  acceptedItems: z
    .array(
      z.object({
        id: z.string(),
        acceptedQuantity: z.number().int().min(0),
      }),
    )
    .optional(),
  refundReference: z.string().min(3).max(80).optional(),
  refundNotes: z.string().max(500).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;
    const { id } = await params;
    const row = await prisma.returnRequest.findUnique({
      where: { id },
      include: returnInclude,
    });
    if (!row) return apiError("Return not found", 404);
    return apiSuccess({
      ...row,
      customerName: `${row.user.firstName} ${row.user.lastName}`.trim(),
      customerPhone: customerPhone(row.user, row.order.shippingAddress),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAdmin(request);
    if (!isAdminAuth(auth)) return auth;
    const { id } = await params;
    const body = patchSchema.parse(await request.json());

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.returnRequest.findUnique({
        where: { id },
        include: { items: true, refund: true },
      });
      if (!row) throw Object.assign(new Error("Return not found"), { status: 404 });

      let status: ReturnStatus = row.status;
      let restockedAt = row.restockedAt;
      const shippingBearer = (body.shippingBearer || row.shippingBearer) as ReturnShippingBearer;
      const deductShipping = body.deductShipping ?? row.deductShipping;
      const returnShippingCost = body.returnShippingCost ?? row.returnShippingCost;

      if (body.action === "reject") {
        if (!body.adminReason) throw Object.assign(new Error("Rejection reason is required"), { status: 400 });
        status = "REJECTED";
      }

      if (body.action === "approve") {
        if (row.status !== "PENDING_REVIEW") {
          throw Object.assign(new Error("Only pending returns can be approved"), { status: 400 });
        }
        status = "APPROVED";
      }

      if (body.action === "awaiting_receipt") {
        if (row.status !== "APPROVED") {
          throw Object.assign(new Error("Approve the return before awaiting receipt"), { status: 400 });
        }
        status = "AWAITING_RECEIPT";
      }

      if (body.action === "received") {
        if (row.status !== "APPROVED" && row.status !== "AWAITING_RECEIPT") {
          throw Object.assign(new Error("Receive is only allowed after approval"), { status: 400 });
        }
        status = "RECEIVED";
      }

      if (body.action === "complete") {
        if (row.status !== "REFUNDED") {
          throw Object.assign(new Error("Complete is only allowed after a recorded refund"), { status: 400 });
        }
        status = "COMPLETED";
      }

      const approved = ["APPROVED", "AWAITING_RECEIPT", "RECEIVED", "REFUNDED", "COMPLETED"].includes(status);
      const acceptedMap = new Map((body.acceptedItems || []).map((item) => [item.id, item.acceptedQuantity]));
      let goodsAmount = 0;
      for (const item of row.items) {
        const accepted =
          acceptedMap.has(item.id) ? acceptedMap.get(item.id)! : (item.acceptedQuantity ?? item.quantity);
        if (accepted > item.quantity) {
          throw Object.assign(new Error("Accepted quantity exceeds requested quantity"), { status: 400 });
        }
        if (body.acceptedItems) {
          await tx.returnItem.update({
            where: { id: item.id },
            data: { acceptedQuantity: accepted },
          });
        }
        const qty = approved ? (acceptedMap.has(item.id) ? accepted : (item.acceptedQuantity ?? item.quantity)) : item.quantity;
        goodsAmount += item.unitPrice * qty;
      }

      const breakdown = calculateReturnRefund({
        goodsAmount,
        returnShippingCost,
        shippingBearer,
        deductShipping,
        approved: approved && status !== "REJECTED",
      });

      if (body.action === "record_refund") {
        if (!canRecordManualRefund(row.status, Boolean(row.refund))) {
          throw Object.assign(new Error("Refund already recorded or return is not eligible"), { status: 409 });
        }
        if (!body.refundReference) {
          throw Object.assign(new Error("Manual refund reference is required"), { status: 400 });
        }
        await tx.returnRefund.create({
          data: {
            returnRequestId: row.id,
            amount: breakdown.refundAmount,
            method: "MANUAL_COD",
            reference: body.refundReference,
            recordedById: auth.user.userId,
            notes: body.refundNotes,
          },
        });
        status = "REFUNDED";
      }

      if (body.action === "received" && !restockedAt) {
        for (const item of row.items) {
          const qty = item.acceptedQuantity ?? item.quantity;
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { quantity: { increment: qty } },
          });
        }
        restockedAt = new Date();
      }

      const saved = await tx.returnRequest.update({
        where: { id: row.id },
        data: {
          status,
          adminReason: body.adminReason ?? row.adminReason,
          internalNotes: body.internalNotes ?? row.internalNotes,
          returnShippingCost: breakdown.returnShippingCost,
          shippingBearer,
          deductShipping,
          goodsAmount: breakdown.goodsAmount,
          shippingDeducted: breakdown.shippingDeducted,
          refundAmount: breakdown.refundAmount,
          restockedAt,
          reviewedById: auth.user.userId,
          reviewedAt: new Date(),
        },
        include: returnInclude,
      });

      if (status !== row.status) {
        await notifyReturnStatus(tx, { userId: row.userId, returnId: row.id, status });
      }

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: `RETURN_${body.action.toUpperCase()}`,
          entity: "ReturnRequest",
          entityId: row.id,
          details: {
            from: row.status,
            to: status,
            refundAmount: breakdown.refundAmount,
            returnShippingCost: breakdown.returnShippingCost,
            shippingBearer,
          },
        },
      });

      return saved;
    });

    return apiSuccess({
      ...updated,
      customerName: `${updated.user.firstName} ${updated.user.lastName}`.trim(),
      customerPhone: customerPhone(updated.user, updated.order.shippingAddress),
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 0;
    if (status && error instanceof Error) return apiError(error.message, status);
    return handleApiError(error);
  }
}
