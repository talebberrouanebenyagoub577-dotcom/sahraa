import { ConfirmationState } from "@prisma/client";
import prisma from "@/lib/prisma";
import { UPSELL_SPECIAL_PRICE } from "@/lib/pricing";
import { purchaseTracking, sendSplitPurchase, type PublicPurchaseTracking } from "@/lib/tracking/capi";
import { appendOrderToGoogleSheet } from "@/lib/services/googleSheet";
import { reasonSummary } from "./score";

interface StoredAttribution {
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  ttclid?: string;
  ttp?: string;
  sc_click_id?: string;
  sc_cookie1?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  eventSourceUrl?: string;
}

export function sheetStatusFor(confirmation: ConfirmationState, status: string): string {
  if (confirmation === ConfirmationState.REJECTED || status === "CANCELLED") return "cancelled";
  if (confirmation === ConfirmationState.REVIEW) return "review";
  if (confirmation === ConfirmationState.CONFIRMED || status === "CONFIRMED" || status === "DELIVERED") return "confirmed";
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "shipped";
  if (status === "RETURNED") return "returned";
  return "new";
}

export async function syncOrderSheet(orderId: string, includePurchaseEvent: boolean): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;
  const address = (order.shippingAddress as { firstName?: string; phone?: string; city?: string; country?: string }) || {};
  const purchase = includePurchaseEvent ? buildPurchase(order) : null;
  await appendOrderToGoogleSheet(
    {
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName: address.firstName || "العميل",
      customerPhone: order.phoneE164 || address.phone || "",
      city: address.city || "المملكة العربية السعودية",
      country: address.country || "SA",
      items: order.items.map((item) => ({
        name: item.nameAr || item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      hasUpsell: order.items.some((item) => item.price === UPSELL_SPECIAL_PRICE),
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: 0,
      total: order.total,
      paymentMethod: "COD",
      status: order.status,
      sheetStatus: sheetStatusFor(order.confirmationState, order.status),
      confirmationNotes: [`المخاطرة: ${order.riskLevel}`, order.holdReason || reasonSummary(order.riskReasons)].filter(Boolean).join(" — "),
      riskLevel: order.riskLevel,
      holdReason: order.holdReason || "",
      utmSource: order.utmSource || undefined,
      utmCampaign: order.utmCampaign || undefined,
      eventId: purchase?.metaEventId,
    },
    includePurchaseEvent ? "order.updated" : "order.created"
  );
}

export function buildPurchase(order: {
  orderNumber: string;
  total: number;
  items: { sku: string; name: string; nameAr: string | null; quantity: number; price: number }[];
}): PublicPurchaseTracking {
  const regular = order.items.filter((item) => item.price !== UPSELL_SPECIAL_PRICE);
  const upsellValue = order.items
    .filter((item) => item.price === UPSELL_SPECIAL_PRICE)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  return purchaseTracking({
    orderNumber: order.orderNumber,
    value: Math.max(0, order.total - upsellValue),
    contents: regular.map((item) => ({
      id: item.sku,
      name: item.nameAr || item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
}

export function previewPurchase(order: {
  orderNumber: string;
  total: number;
  items: { sku: string; name: string; nameAr: string | null; quantity: number; price: number }[];
}): { purchase: PublicPurchaseTracking; upsell: PublicPurchaseTracking | null } {
  const purchase = buildPurchase(order);
  const upsellItem = order.items.find((item) => item.price === UPSELL_SPECIAL_PRICE);
  const upsell = upsellItem
    ? purchaseTracking({
        orderNumber: order.orderNumber,
        value: UPSELL_SPECIAL_PRICE,
        upsell: true,
        contents: [{ id: upsellItem.sku, name: upsellItem.nameAr || upsellItem.name, quantity: 1, price: UPSELL_SPECIAL_PRICE }],
      })
    : null;
  return { purchase, upsell };
}

export function checkoutPurchasePlan(order: {
  status: string;
  confirmationState: ConfirmationState;
  orderNumber: string;
  total: number;
  items: { sku: string; name: string; nameAr: string | null; quantity: number; price: number }[];
}): { emit: boolean; tracking: ReturnType<typeof previewPurchase> | null } {
  if (order.status === "CANCELLED" || order.confirmationState === ConfirmationState.REJECTED) {
    return { emit: false, tracking: null };
  }
  return { emit: true, tracking: previewPurchase(order) };
}

/** Sends Purchase / CompletePayment / PURCHASE once. Refused and cancelled orders are skipped. */
export async function emitConfirmedPurchase(
  orderId: string,
  options?: { allowUnconfirmed?: boolean }
): Promise<{ purchase: PublicPurchaseTracking; upsell: PublicPurchaseTracking | null } | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.status === "CANCELLED" || order.confirmationState === ConfirmationState.REJECTED) {
    return null;
  }
  if (order.confirmationState !== ConfirmationState.CONFIRMED && !options?.allowUnconfirmed) {
    return null;
  }
  const address = (order.shippingAddress as { firstName?: string; city?: string }) || {};
  const attribution = (order.attribution || {}) as StoredAttribution;
  const appUrl = process.env.PUBLIC_APP_URL || "https://sahraaaaaaaaaaa.shop";
  const context = {
    ip: order.clientIp || undefined,
    eventSourceUrl: attribution.eventSourceUrl || `${appUrl}/ar/order/success/${order.id}`,
    attribution,
    user: {
      phone: order.phoneE164 || undefined,
      firstName: address.firstName,
      city: address.city,
      country: "sa",
      externalId: order.id,
    },
  };
  const { purchase, upsell } = previewPurchase(order);
  await sendSplitPurchase(purchase, context);
  if (upsell) await sendSplitPurchase(upsell, context);
  return { purchase, upsell };
}
