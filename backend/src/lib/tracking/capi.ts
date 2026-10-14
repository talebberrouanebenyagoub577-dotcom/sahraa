import {
  hashCity,
  hashCountry,
  hashEmail,
  hashName,
  hashPhoneForMeta,
  hashPhoneForTikTok,
  sha256Hex,
} from "@/lib/tracking/phone";
import { claimTrackingEvent, finishTrackingEvent } from "@/lib/tracking/record";

export interface Attribution {
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

export interface CommerceItem {
  id: string;
  name?: string;
  quantity: number;
  price: number;
}

export interface CommerceEvent {
  eventId: string;
  metaName: string;
  tiktokName: string;
  snapName: string;
  value?: number;
  currency?: string;
  orderId?: string;
  contents?: CommerceItem[];
}

export interface TrackingUser {
  phone?: string;
  email?: string;
  firstName?: string;
  city?: string;
  country?: string;
  externalId?: string;
}

export interface TrackingContext {
  ip?: string;
  userAgent?: string;
  eventSourceUrl?: string;
  attribution?: Attribution;
  user?: TrackingUser;
}

const TIMEOUT_MS = 8000;

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

export function buildFbc(attribution?: Attribution): string | undefined {
  if (!attribution) return undefined;
  if (attribution.fbc) return attribution.fbc;
  if (!attribution.fbclid) return undefined;
  return `fb.1.${Date.now()}.${attribution.fbclid}`;
}

function contentsValue(event: CommerceEvent): number | undefined {
  if (typeof event.value === "number") return event.value;
  return undefined;
}

async function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<boolean> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    console.warn(`[capi] ${response.status} from ${new URL(url).host}`);
    return false;
  }
  return true;
}

async function sendMeta(event: CommerceEvent, ctx: TrackingContext): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return;
  if (!(await claimTrackingEvent(event.eventId, "meta", event.metaName))) return;

  const user = ctx.user || {};
  const userData: Record<string, unknown> = {};
  const ph = user.phone ? hashPhoneForMeta(user.phone) : null;
  const em = hashEmail(user.email);
  const fn = hashName(user.firstName);
  const ct = hashCity(user.city);
  const country = user.country ? hashCountry(user.country) : null;
  const external = user.externalId ? sha256Hex(user.externalId) : null;
  if (ph) userData.ph = [ph];
  if (em) userData.em = [em];
  if (fn) userData.fn = [fn];
  if (ct) userData.ct = [ct];
  if (country) userData.country = [country];
  if (external) userData.external_id = [external];
  if (ctx.ip) userData.client_ip_address = ctx.ip;
  if (ctx.userAgent) userData.client_user_agent = ctx.userAgent;
  const fbc = buildFbc(ctx.attribution);
  if (fbc) userData.fbc = fbc;
  if (ctx.attribution?.fbp) userData.fbp = ctx.attribution.fbp;

  const customData: Record<string, unknown> = {};
  const value = contentsValue(event);
  if (event.currency) customData.currency = event.currency;
  if (typeof value === "number") customData.value = value;
  if (event.orderId) customData.order_id = event.orderId;
  if (event.contents?.length) {
    customData.contents = event.contents.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_price: item.price,
    }));
    customData.content_type = "product";
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: event.metaName,
        event_time: unixNow(),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: ctx.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
    access_token: token,
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  try {
    const ok = await postJson(`https://graph.facebook.com/v21.0/${pixelId}/events`, body, {});
    await finishTrackingEvent(event.eventId, "meta", ok ? "sent" : "failed");
  } catch (error) {
    console.warn("[capi] meta failed", error instanceof Error ? error.name : "");
    await finishTrackingEvent(event.eventId, "meta", "failed");
  }
}

async function sendTikTok(event: CommerceEvent, ctx: TrackingContext): Promise<void> {
  const pixelId = process.env.TIKTOK_PIXEL_ID;
  const token = process.env.TIKTOK_EVENTS_ACCESS_TOKEN;
  if (!pixelId || !token) return;
  if (!(await claimTrackingEvent(event.eventId, "tiktok", event.tiktokName))) return;

  const user = ctx.user || {};
  const userPayload: Record<string, unknown> = {};
  const phone = user.phone ? hashPhoneForTikTok(user.phone) : null;
  const email = hashEmail(user.email);
  const external = user.externalId ? sha256Hex(user.externalId) : null;
  if (phone) userPayload.phone = phone;
  if (email) userPayload.email = email;
  if (external) userPayload.external_id = external;
  if (ctx.attribution?.ttclid) userPayload.ttclid = ctx.attribution.ttclid;
  if (ctx.attribution?.ttp) userPayload.ttp = ctx.attribution.ttp;
  if (ctx.ip) userPayload.ip = ctx.ip;
  if (ctx.userAgent) userPayload.user_agent = ctx.userAgent;

  const properties: Record<string, unknown> = {};
  const value = contentsValue(event);
  if (event.currency) properties.currency = event.currency;
  if (typeof value === "number") properties.value = value;
  if (event.contents?.length) {
    properties.content_type = "product";
    properties.contents = event.contents.map((item) => ({
      content_id: item.id,
      content_name: item.name || item.id,
      quantity: item.quantity,
      price: item.price,
    }));
  }

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: pixelId,
    data: [
      {
        event: event.tiktokName,
        event_time: unixNow(),
        event_id: event.eventId,
        user: userPayload,
        page: { url: ctx.eventSourceUrl },
        properties,
      },
    ],
  };
  if (process.env.TIKTOK_TEST_EVENT_CODE) body.test_event_code = process.env.TIKTOK_TEST_EVENT_CODE;

  try {
    const ok = await postJson("https://business-api.tiktok.com/open_api/v1.3/event/track/", body, {
      "Access-Token": token,
    });
    await finishTrackingEvent(event.eventId, "tiktok", ok ? "sent" : "failed");
  } catch (error) {
    console.warn("[capi] tiktok failed", error instanceof Error ? error.name : "");
    await finishTrackingEvent(event.eventId, "tiktok", "failed");
  }
}

async function sendSnap(event: CommerceEvent, ctx: TrackingContext): Promise<void> {
  const pixelId = process.env.SNAP_PIXEL_ID;
  const token = process.env.SNAP_CAPI_TOKEN;
  if (!pixelId || !token) return;
  if (!(await claimTrackingEvent(event.eventId, "snap", event.snapName))) return;

  const user = ctx.user || {};
  const userData: Record<string, unknown> = {};
  const ph = user.phone ? hashPhoneForMeta(user.phone) : null;
  const em = hashEmail(user.email);
  const fn = hashName(user.firstName);
  const ct = hashCity(user.city);
  const country = user.country ? hashCountry(user.country) : null;
  if (ph) userData.ph = [ph];
  if (em) userData.em = [em];
  if (fn) userData.fn = [fn];
  if (ct) userData.ct = [ct];
  if (country) userData.country = [country];
  if (ctx.ip) userData.client_ip_address = ctx.ip;
  if (ctx.userAgent) userData.client_user_agent = ctx.userAgent;
  if (ctx.attribution?.sc_click_id) userData.sc_click_id = ctx.attribution.sc_click_id;
  if (ctx.attribution?.sc_cookie1) userData.sc_cookie1 = ctx.attribution.sc_cookie1;

  const customData: Record<string, unknown> = {};
  const value = contentsValue(event);
  if (event.currency) customData.currency = event.currency;
  if (typeof value === "number") customData.value = value;
  if (event.orderId) customData.order_id = event.orderId;
  if (event.contents?.length) {
    customData.content_ids = event.contents.map((item) => item.id);
    customData.num_items = String(event.contents.reduce((sum, item) => sum + item.quantity, 0));
    customData.content_type = "product";
  }

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: event.snapName,
        event_time: unixNow(),
        event_id: event.eventId,
        action_source: "WEB",
        event_source_url: ctx.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (process.env.SNAP_TEST_EVENT_CODE) body.test_event_code = process.env.SNAP_TEST_EVENT_CODE;

  const url = `https://tr.snapchat.com/v3/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  try {
    const ok = await postJson(url, body, {});
    await finishTrackingEvent(event.eventId, "snap", ok ? "sent" : "failed");
  } catch (error) {
    console.warn("[capi] snap failed", error instanceof Error ? error.name : "");
    await finishTrackingEvent(event.eventId, "snap", "failed");
  }
}

export async function sendCapiEvent(event: CommerceEvent, ctx: TrackingContext): Promise<void> {
  await Promise.allSettled([sendMeta(event, ctx), sendTikTok(event, ctx), sendSnap(event, ctx)]);
}

export interface PublicPurchaseTracking {
  value: number;
  currency: "SAR";
  orderId: string;
  contents: CommerceItem[];
  metaEventId: string;
  tiktokEventId: string;
  snapEventId: string;
  metaName: "Purchase";
  tiktokName: "CompletePayment";
  snapName: "PURCHASE";
}

export function purchaseTracking(input: {
  orderNumber: string;
  value: number;
  contents: CommerceItem[];
  upsell?: boolean;
}): PublicPurchaseTracking {
  const suffix = input.upsell ? "_Upsell" : "";
  return {
    value: input.value,
    currency: "SAR",
    orderId: input.orderNumber,
    contents: input.contents,
    metaEventId: `${input.orderNumber}_Purchase${suffix}`,
    tiktokEventId: `${input.orderNumber}_CompletePayment${suffix}`,
    snapEventId: `${input.orderNumber}_PURCHASE${suffix}`,
    metaName: "Purchase",
    tiktokName: "CompletePayment",
    snapName: "PURCHASE",
  };
}

export async function sendSplitPurchase(
  tracking: PublicPurchaseTracking,
  ctx: TrackingContext
): Promise<void> {
  await Promise.allSettled([
    sendMeta(
      {
        eventId: tracking.metaEventId,
        metaName: "Purchase",
        tiktokName: "CompletePayment",
        snapName: "PURCHASE",
        value: tracking.value,
        currency: "SAR",
        orderId: tracking.orderId,
        contents: tracking.contents,
      },
      ctx
    ),
    sendTikTok(
      {
        eventId: tracking.tiktokEventId,
        metaName: "Purchase",
        tiktokName: "CompletePayment",
        snapName: "PURCHASE",
        value: tracking.value,
        currency: "SAR",
        orderId: tracking.orderId,
        contents: tracking.contents,
      },
      ctx
    ),
    sendSnap(
      {
        eventId: tracking.snapEventId,
        metaName: "Purchase",
        tiktokName: "CompletePayment",
        snapName: "PURCHASE",
        value: tracking.value,
        currency: "SAR",
        orderId: tracking.orderId,
        contents: tracking.contents,
      },
      ctx
    ),
  ]);
}
