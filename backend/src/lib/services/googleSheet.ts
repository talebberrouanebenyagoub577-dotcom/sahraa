import { createHash } from "crypto";
import { redis } from "@/lib/redis";
import { toE164 } from "@/lib/tracking/phone";

export interface SheetOrderItem {
  name: string;
  quantity: number;
  price: number;
  isUpsell?: boolean;
}

export type SheetOrderEvent = "order.created" | "order.updated";

export interface SheetOrderPayload {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  city?: string;
  country?: string;
  items: SheetOrderItem[];
  hasUpsell: boolean;
  upsellProduct?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: string;
  sheetStatus?: string;
  confirmationNotes?: string;
  riskLevel?: string;
  holdReason?: string;
  utmSource?: string;
  utmCampaign?: string;
  eventId?: string;
}

function sheetStatusOf(order: SheetOrderPayload): string {
  if (order.sheetStatus) return order.sheetStatus;
  switch ((order.status || "").toUpperCase()) {
    case "CANCELLED":
    case "REJECTED":
      return "cancelled";
    case "CONFIRMED":
    case "DELIVERED":
      return "confirmed";
    case "PROCESSING":
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "shipped";
    case "RETURNED":
    case "REFUNDED":
      return "returned";
    default:
      return "new";
  }
}

const WEBHOOK_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;
const DEDUP_TTL_SECONDS = 60 * 60 * 24;
const DEDUP_KEY_PREFIX = "gsheet:sent:";

// Used only when Redis is unavailable; per-process, so it cannot dedupe across instances.
const localSent = new Map<string, number>();
const LOCAL_SENT_MAX = 1000;

async function claimDelivery(key: string): Promise<boolean> {
  if (redis) {
    try {
      const result = await redis.set(key, "1", "EX", DEDUP_TTL_SECONDS, "NX");
      return result === "OK";
    } catch {
      // Fall through to the in-memory guard.
    }
  }

  const now = Date.now();
  const expiresAt = localSent.get(key);
  if (expiresAt && expiresAt > now) return false;

  if (localSent.size >= LOCAL_SENT_MAX) {
    for (const [k, exp] of localSent) {
      if (exp <= now) localSent.delete(k);
    }
    if (localSent.size >= LOCAL_SENT_MAX) {
      const oldest = localSent.keys().next().value;
      if (oldest) localSent.delete(oldest);
    }
  }
  localSent.set(key, now + DEDUP_TTL_SECONDS * 1000);
  return true;
}

async function releaseDelivery(key: string): Promise<void> {
  localSent.delete(key);
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "TimeoutError" || err.name === "AbortError") return "timeout";
    return err.name;
  }
  return "unknown";
}

async function postWithTimeout(url: string, body: string, secret: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Sheet-Secret": secret } : {}),
    },
    body,
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });
}

/**
 * Sends order details to a Google Sheets webhook or service.
 * Supports Google Apps Script Webhook URLs or automation webhooks (Make / Zapier / custom).
 * If GOOGLE_SHEETS_WEBHOOK_URL is not set in environment, the sync is skipped.
 *
 * Never throws: a Sheets failure must not affect order creation.
 * Identical payloads for the same orderNumber are sent at most once per DEDUP_TTL_SECONDS;
 * the receiving script should upsert rows by `idempotencyKey` (the orderNumber).
 */
export async function appendOrderToGoogleSheet(
  order: SheetOrderPayload,
  event: SheetOrderEvent = "order.created"
): Promise<boolean> {
  try {
    if (process.env.SHEETS_SYNC_ENABLED === "false") return false;
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const secret = process.env.GOOGLE_SHEETS_SHARED_SECRET || "";
    const phone = toE164(order.customerPhone);
    const payload = {
      secret,
      event,
      idempotencyKey: order.orderNumber,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: phone,
      phone,
      city: order.city || "",
      country: order.country || "SA",
      items: order.items.map((item) => ({ name: item.name, quantity: item.quantity })),
      qty: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.total,
      currency: "SAR",
      paymentMethod: "COD",
      hasUpsell: order.hasUpsell,
      upsellProduct: order.upsellProduct || "",
      status: sheetStatusOf(order),
      confirmation_notes: order.confirmationNotes || order.holdReason || "",
      confirmationNotes: order.confirmationNotes || order.holdReason || "",
      riskLevel: order.riskLevel || "",
      utm_source: order.utmSource || "",
      utm_campaign: order.utmCampaign || "",
      eventId: order.eventId || "",
      event_id: order.eventId || "",
    };

    if (!webhookUrl) {
      console.log(`[GoogleSheet] GOOGLE_SHEETS_WEBHOOK_URL not set; skipped ${event} for order ${order.orderNumber}`);
      return false;
    }

    const body = JSON.stringify(payload);
    const fingerprint = createHash("sha256").update(`${order.orderNumber}:${event}:${body}`).digest("hex").slice(0, 16);
    const dedupKey = `${DEDUP_KEY_PREFIX}${order.orderNumber}:${fingerprint}`;

    if (!(await claimDelivery(dedupKey))) {
      console.log(`[GoogleSheet] Skipped duplicate ${event} for order ${order.orderNumber}`);
      return true;
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const target = new URL(webhookUrl);
        if (secret) target.searchParams.set("secret", secret);
        const response = await postWithTimeout(target.toString(), body, secret);
        if (response.ok) return true;

        const retryable = response.status >= 500 || response.status === 429;
        console.warn(
          `[GoogleSheet] Webhook returned status ${response.status} for order ${order.orderNumber} (attempt ${attempt}/${MAX_ATTEMPTS})`
        );
        if (!retryable) break;
      } catch (err) {
        console.warn(
          `[GoogleSheet] Webhook request failed (${describeError(err)}) for order ${order.orderNumber} (attempt ${attempt}/${MAX_ATTEMPTS})`
        );
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    await releaseDelivery(dedupKey);
    console.error(`[GoogleSheet] Failed to sync ${event} for order ${order.orderNumber}`);
    return false;
  } catch (err) {
    console.error(`[GoogleSheet] Unexpected sync error (${describeError(err)}) for order ${order.orderNumber}`);
    return false;
  }
}
