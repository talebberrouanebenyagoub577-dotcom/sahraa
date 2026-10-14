import { NextRequest } from "next/server";
import { ConfirmationState } from "@prisma/client";
import prisma from "@/lib/prisma";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { otpEnabled } from "@/lib/fraud/config";
import { consumeRate } from "@/lib/fraud/limit";
import { otpMatches } from "@/lib/fraud/otp";
import { emitConfirmedPurchase, previewPurchase, syncOrderSheet } from "@/lib/fraud/purchase";
import { after } from "@/lib/http/after";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!consumeRate(`confirm:${id}`, 8, 10 * 60 * 1000)) {
      return apiError("محاولات تأكيد كثيرة. انتظر قليلاً ثم أعد المحاولة.", 429);
    }

    const body = await request.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const order = await prisma.order.findUnique({ where: { id }, include: { otp: true } });
    if (!order) return apiError("الطلب غير موجود.", 404);
    if (order.confirmationState === ConfirmationState.REJECTED || order.status === "CANCELLED") {
      return apiError("هذا الطلب غير متاح للتأكيد.", 400);
    }
    if (order.confirmationState === ConfirmationState.REVIEW || order.riskLevel === "HIGH") {
      return apiError("طلبك قيد المراجعة ولن يُشحن قبل موافقة الفريق.", 409);
    }
    if (order.confirmationState === ConfirmationState.CONFIRMED) {
      const tracking = await emitConfirmedPurchase(order.id);
      return apiSuccess({ confirmationState: order.confirmationState, tracking });
    }

    const otp = order.otp;
    const otpRequired = otpEnabled() && otp?.delivery === "sent" && !otp.verifiedAt;
    if (otpRequired && otp) {
      if (otp.attempts >= 5 || otp.expiresAt.getTime() < Date.now()) {
        return apiError("انتهت صلاحية رمز التحقق. أكّد الطلب عبر واتساب أو انتظر اتصال الفريق.", 400);
      }
      if (!otpMatches(order.id, code, otp.codeHash)) {
        await prisma.orderOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
        return apiError("رمز التحقق غير صحيح.", 400);
      }
      await prisma.orderOtp.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        confirmationState: ConfirmationState.CONFIRMED,
        status: order.status === "PENDING" ? "CONFIRMED" : order.status,
        statusHistory: { create: { status: "CONFIRMED", note: "Customer confirmed the COD order" } },
      },
    });
    after(() => emitConfirmedPurchase(order.id));
    after(() => syncOrderSheet(order.id, true));
    const confirmed = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    const tracking = confirmed ? previewPurchase(confirmed) : null;
    return apiSuccess({ confirmationState: ConfirmationState.CONFIRMED, tracking });
  } catch (error) {
    return handleApiError(error);
  }
}
