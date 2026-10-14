"use client";

import { apiUrl } from "@/lib/api";

const STORAGE_KEY = "sahraa_attribution_v1";

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

export interface PixelUser {
  phone?: string;
  firstName?: string;
  city?: string;
}

interface PixelEvent {
  id: string;
  name: string;
  params?: Record<string, unknown>;
}

interface QueuedEvent {
  meta?: PixelEvent;
  tiktok?: PixelEvent;
  snap?: PixelEvent;
  metaSent?: boolean;
  tiktokSent?: boolean;
  snapSent?: boolean;
}

declare global {
  interface Window {
    __sahraaTrack?: QueuedEvent[];
    __sahraaFlush?: () => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void; identify?: (...args: unknown[]) => void };
    snaptr?: (...args: unknown[]) => void;
  }
}

function pixelId(name: "META" | "TIKTOK" | "SNAP"): string {
  const value =
    name === "META"
      ? process.env.NEXT_PUBLIC_META_PIXEL_ID
      : name === "TIKTOK"
        ? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
        : process.env.NEXT_PUBLIC_SNAP_PIXEL_ID;
  return value && /^[A-Za-z0-9_-]+$/.test(value) ? value : "";
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const stored = readStored();
  const fbclid = params.get("fbclid") || stored.fbclid;
  const fbcCookie = readCookie("_fbc");
  const next: Attribution = {
    ...stored,
    fbclid,
    fbc: fbcCookie || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : stored.fbc),
    fbp: readCookie("_fbp") || stored.fbp,
    ttclid: params.get("ttclid") || stored.ttclid,
    ttp: readCookie("_ttp") || stored.ttp,
    sc_click_id: params.get("ScCid") || stored.sc_click_id,
    sc_cookie1: readCookie("_scid") || stored.sc_cookie1,
    utm_source: params.get("utm_source") || stored.utm_source,
    utm_campaign: params.get("utm_campaign") || stored.utm_campaign,
    utm_content: params.get("utm_content") || stored.utm_content,
    utm_term: params.get("utm_term") || stored.utm_term,
    eventSourceUrl: window.location.href,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

const DEVICE_KEY = "sahraa_device_id_v1";

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return "";
  }
}

function readStored(): Attribution {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const stored = readStored();
  return { ...stored, eventSourceUrl: window.location.href };
}

function eventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function flush() {
  const queue = window.__sahraaTrack || [];
  const metaOn = Boolean(pixelId("META"));
  const tiktokOn = Boolean(pixelId("TIKTOK"));
  const snapOn = Boolean(pixelId("SNAP"));
  const pending: QueuedEvent[] = [];
  for (const item of queue) {
    if (item.meta && !item.metaSent) {
      if (!metaOn) item.metaSent = true;
      else if (window.fbq) {
        window.fbq("track", item.meta.name, item.meta.params || {}, { eventID: item.meta.id });
        item.metaSent = true;
      }
    }
    if (item.tiktok && !item.tiktokSent) {
      if (!tiktokOn) item.tiktokSent = true;
      else if (window.ttq) {
        window.ttq.track(item.tiktok.name, item.tiktok.params || {}, { event_id: item.tiktok.id });
        item.tiktokSent = true;
      }
    }
    if (item.snap && !item.snapSent) {
      if (!snapOn) item.snapSent = true;
      else if (window.snaptr) {
        window.snaptr("track", item.snap.name, { ...(item.snap.params || {}), client_dedup_id: item.snap.id });
        item.snapSent = true;
      }
    }
    if ((item.meta && !item.metaSent) || (item.tiktok && !item.tiktokSent) || (item.snap && !item.snapSent)) {
      pending.push(item);
    }
  }
  window.__sahraaTrack = pending;
}

if (typeof window !== "undefined") {
  window.__sahraaTrack = window.__sahraaTrack || [];
  window.__sahraaFlush = flush;
}

function enqueue(item: QueuedEvent, serverBody?: Record<string, unknown>) {
  window.__sahraaTrack = window.__sahraaTrack || [];
  window.__sahraaTrack.push(item);
  flush();
  if (!serverBody) return;
  const url = apiUrl("/v1/track");
  if (!url.startsWith("http")) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(serverBody),
    keepalive: true,
    credentials: "include",
  }).catch(() => undefined);
}

function browserEvent(name: { meta: string; tiktok: string; snap: string }, params: Record<string, unknown>, server: boolean) {
  const id = eventId();
  const attribution = getAttribution();
  enqueue(
    {
      meta: { id, name: name.meta, params },
      tiktok: { id, name: name.tiktok, params },
      snap: { id, name: name.snap, params },
    },
    server
      ? {
          eventId: id,
          eventName: name.meta === "PageView" ? "PageView" : name.meta,
          eventSourceUrl: attribution.eventSourceUrl,
          value: params.value,
          currency: params.currency,
          contents: params.contents,
          attribution,
        }
      : undefined
  );
}

export function trackPageView() {
  browserEvent({ meta: "PageView", tiktok: "Pageview", snap: "PAGE_VIEW" }, {}, true);
}

export function trackViewContent(input: { id: string; name: string; value: number }) {
  browserEvent(
    { meta: "ViewContent", tiktok: "ViewContent", snap: "VIEW_CONTENT" },
    {
      content_ids: [input.id],
      content_type: "product",
      content_name: input.name,
      value: input.value,
      currency: "SAR",
      contents: [{ id: input.id, quantity: 1, price: input.value, name: input.name }],
    },
    true
  );
}

export function trackAddToCart(input: { id: string; name: string; value: number; quantity: number }) {
  browserEvent(
    { meta: "AddToCart", tiktok: "AddToCart", snap: "ADD_CART" },
    {
      content_ids: [input.id],
      content_type: "product",
      value: input.value,
      currency: "SAR",
      contents: [{ id: input.id, quantity: input.quantity, price: input.value, name: input.name }],
    },
    true
  );
}

export function trackInitiateCheckout(input: { value: number; contents: Array<{ id: string; quantity: number; price: number; name?: string }> }) {
  browserEvent(
    { meta: "InitiateCheckout", tiktok: "InitiateCheckout", snap: "START_CHECKOUT" },
    { value: input.value, currency: "SAR", content_type: "product", contents: input.contents },
    true
  );
}

export interface ServerPurchase {
  value: number;
  currency: "SAR";
  orderId: string;
  contents: Array<{ id: string; name?: string; quantity: number; price: number }>;
  metaEventId: string;
  tiktokEventId: string;
  snapEventId: string;
}

export function trackServerPurchase(tracking: ServerPurchase | null | undefined, user?: PixelUser) {
  if (!tracking) return;
  if (user?.phone && window.fbq && pixelId("META")) {
    window.fbq("init", pixelId("META"), { ph: user.phone, fn: user.firstName, ct: user.city, country: "sa" });
  }
  if (user?.phone && window.ttq?.identify) {
    window.ttq.identify({ phone: user.phone, external_id: tracking.orderId });
  }
  if (user?.phone && window.snaptr && pixelId("SNAP")) {
    window.snaptr("init", pixelId("SNAP"), { user_phone: user.phone });
  }
  const params = {
    value: tracking.value,
    currency: tracking.currency,
    content_type: "product",
    content_ids: tracking.contents.map((item) => item.id),
    contents: tracking.contents,
    order_id: tracking.orderId,
    num_items: tracking.contents.reduce((sum, item) => sum + item.quantity, 0),
  };
  enqueue({
    meta: { id: tracking.metaEventId, name: "Purchase", params },
    tiktok: { id: tracking.tiktokEventId, name: "CompletePayment", params },
    snap: {
      id: tracking.snapEventId,
      name: "PURCHASE",
      params: { ...params, price: tracking.value, transaction_id: tracking.orderId },
    },
  });
}
