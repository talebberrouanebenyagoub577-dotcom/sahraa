import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendCapiEvent, type Attribution, type CommerceItem } from "@/lib/tracking/capi";

const itemSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(300).optional(),
  quantity: z.number().int().min(1).max(99),
  price: z.number().min(0).max(100000),
});

const bodySchema = z.object({
  eventId: z.string().min(8).max(200),
  eventName: z.enum(["PageView", "ViewContent", "AddToCart", "InitiateCheckout"]),
  eventSourceUrl: z.string().max(2000).optional(),
  value: z.number().min(0).max(100000).optional(),
  currency: z.literal("SAR").optional(),
  contents: z.array(itemSchema).max(30).optional(),
  attribution: z
    .object({
      fbc: z.string().max(500).optional(),
      fbp: z.string().max(500).optional(),
      fbclid: z.string().max(500).optional(),
      ttclid: z.string().max(500).optional(),
      ttp: z.string().max(500).optional(),
      sc_click_id: z.string().max(500).optional(),
      sc_cookie1: z.string().max(500).optional(),
      utm_source: z.string().max(200).optional(),
      utm_campaign: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      utm_term: z.string().max(200).optional(),
    })
    .optional(),
  user: z
    .object({
      phone: z.string().max(30).optional(),
      email: z.string().max(200).optional(),
      firstName: z.string().max(120).optional(),
      city: z.string().max(120).optional(),
    })
    .optional(),
});

const NAMES = {
  PageView: { meta: "PageView", tiktok: "Pageview", snap: "PAGE_VIEW" },
  ViewContent: { meta: "ViewContent", tiktok: "ViewContent", snap: "VIEW_CONTENT" },
  AddToCart: { meta: "AddToCart", tiktok: "AddToCart", snap: "ADD_CART" },
  InitiateCheckout: { meta: "InitiateCheckout", tiktok: "InitiateCheckout", snap: "START_CHECKOUT" },
} as const;

export function clientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  return request.headers.get("x-real-ip") || undefined;
}

export async function handleTrack(request: NextRequest): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 422 });
  }

  const data = parsed.data;
  const names = NAMES[data.eventName];
  const contents: CommerceItem[] | undefined = data.contents?.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const attribution: Attribution | undefined = data.attribution;
  const eventSourceUrl = data.eventSourceUrl || request.headers.get("referer") || process.env.PUBLIC_APP_URL;

  void sendCapiEvent(
    {
      eventId: data.eventId,
      metaName: names.meta,
      tiktokName: names.tiktok,
      snapName: names.snap,
      value: data.value,
      currency: data.currency,
      contents,
    },
    {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") || undefined,
      eventSourceUrl,
      attribution,
      user: data.user
        ? {
            phone: data.user.phone,
            email: data.user.email,
            firstName: data.user.firstName,
            city: data.user.city,
            country: data.user.phone || data.user.city ? "sa" : undefined,
          }
        : undefined,
    }
  ).catch((error) => {
    console.error("[track]", error instanceof Error ? error.message : "failed");
  });

  return NextResponse.json({ success: true });
}
