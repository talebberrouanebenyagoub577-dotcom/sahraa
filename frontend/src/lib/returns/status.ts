export const RETURN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "AWAITING_RECEIPT",
  "RECEIVED",
  "REFUNDED",
  "COMPLETED",
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export function returnStatusLabel(status: string, isRtl: boolean) {
  const labels: Record<string, { ar: string; en: string }> = {
    PENDING_REVIEW: { ar: "قيد المراجعة", en: "Under review" },
    APPROVED: { ar: "مقبول", en: "Approved" },
    REJECTED: { ar: "مرفوض", en: "Rejected" },
    AWAITING_RECEIPT: { ar: "بانتظار استلام المنتج", en: "Awaiting receipt" },
    RECEIVED: { ar: "تم الاستلام", en: "Received" },
    REFUNDED: { ar: "تم رد المبلغ", en: "Refund recorded" },
    COMPLETED: { ar: "مكتمل", en: "Completed" },
  };
  const row = labels[status];
  if (!row) return status;
  return isRtl ? row.ar : row.en;
}
