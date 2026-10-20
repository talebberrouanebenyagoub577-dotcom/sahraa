import type { PrismaClient, Prisma, ReturnStatus } from "@prisma/client";

const STATUS_COPY: Record<
  ReturnStatus,
  { title: string; titleAr: string; message: string; messageAr: string }
> = {
  PENDING_REVIEW: {
    title: "Return request received",
    titleAr: "تم استلام طلب الإرجاع",
    message: "Your return request is under review.",
    messageAr: "طلب الإرجاع قيد المراجعة.",
  },
  APPROVED: {
    title: "Return approved",
    titleAr: "تم قبول طلب الإرجاع",
    message: "Your return was approved. Follow the next status for pickup.",
    messageAr: "تم قبول طلب الإرجاع. تابع حالة استلام المنتج.",
  },
  REJECTED: {
    title: "Return rejected",
    titleAr: "تم رفض طلب الإرجاع",
    message: "Your return request was rejected.",
    messageAr: "تم رفض طلب الإرجاع.",
  },
  AWAITING_RECEIPT: {
    title: "Waiting to receive the return",
    titleAr: "بانتظار استلام المنتج",
    message: "We are waiting to receive the returned item.",
    messageAr: "بانتظار استلام المنتج المرتجع.",
  },
  RECEIVED: {
    title: "Returned item received",
    titleAr: "تم استلام المنتج",
    message: "We received your returned item.",
    messageAr: "تم استلام المنتج المرتجع.",
  },
  REFUNDED: {
    title: "Manual refund recorded",
    titleAr: "تم تسجيل رد المبلغ",
    message: "A manual COD refund was recorded for your return.",
    messageAr: "تم تسجيل استرداد يدوي للدفع عند الاستلام.",
  },
  COMPLETED: {
    title: "Return completed",
    titleAr: "اكتمل طلب الإرجاع",
    message: "Your return request is complete.",
    messageAr: "اكتمل طلب الإرجاع.",
  },
};

export async function notifyReturnStatus(
  db: PrismaClient | Prisma.TransactionClient,
  input: { userId: string; returnId: string; status: ReturnStatus },
) {
  const copy = STATUS_COPY[input.status];
  await db.notification.create({
    data: {
      userId: input.userId,
      title: copy.title,
      titleAr: copy.titleAr,
      message: copy.message,
      messageAr: copy.messageAr,
      type: "RETURN",
      link: `/dashboard/customer/returns/${input.returnId}`,
    },
  });
}
