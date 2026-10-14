import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ConfirmationState, OrderStatus, PaymentMethod } from "@prisma/client";
import prisma from "@/lib/prisma";
import { toE164 } from "@/lib/tracking/phone";

const SHEET_STATUS = [
  "new",
  "no_answer",
  "review",
  "confirmed",
  "cancelled",
  "shipped",
  "delivered",
  "refused",
  "returned",
] as const;

const bodySchema = z.object({
  orderNumber: z.string().min(1).max(80),
  status: z.string().max(40).optional(),
  confirmationNotes: z.string().max(2000).optional(),
  courier: z.string().max(120).optional(),
  trackingNumber: z.string().max(120).optional(),
  customer_name: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  city: z.string().max(120).optional(),
  items: z.union([z.string().max(4000), z.array(z.unknown())]).optional(),
  total: z.union([z.number(), z.string()]).optional(),
});

function secretsMatch(provided: string | null): boolean {
  const expected = process.env.GOOGLE_SHEETS_SHARED_SECRET || "";
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function confirmationFor(status: string): ConfirmationState | null {
  if (status === "review") return ConfirmationState.REVIEW;
  if (status === "confirmed") return ConfirmationState.CONFIRMED;
  if (status === "cancelled" || status === "refused") return ConfirmationState.REJECTED;
  return null;
}

function mapStatus(status: string | undefined): OrderStatus | null {
  switch (status) {
    case "new":
    case "no_answer":
    case "review":
      return OrderStatus.PENDING;
    case "confirmed":
      return OrderStatus.CONFIRMED;
    case "cancelled":
    case "refused":
      return OrderStatus.CANCELLED;
    case "shipped":
      return OrderStatus.SHIPPED;
    case "delivered":
      return OrderStatus.DELIVERED;
    case "returned":
      return OrderStatus.RETURNED;
    default:
      return null;
  }
}

function itemsText(items: unknown): string {
  if (typeof items === "string") return items;
  if (!Array.isArray(items)) return "";
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const row = item as { name?: string; quantity?: number };
      return row.name ? `${row.name} ×${row.quantity || 1}` : "";
    })
    .filter(Boolean)
    .join(" | ");
}

export async function handleSheetSync(request: NextRequest): Promise<Response> {
  const header = request.headers.get("x-sheet-secret");
  if (!secretsMatch(header)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

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
  const sheetStatus = data.status || "new";
  if (!SHEET_STATUS.includes(sheetStatus as (typeof SHEET_STATUS)[number])) {
    return NextResponse.json({ success: false, error: "Unknown status" }, { status: 422 });
  }

  const orderStatus = mapStatus(sheetStatus);
  const existing = await prisma.order.findUnique({ where: { orderNumber: data.orderNumber } });

  if (!existing) {
    const total = Number(data.total);
    const canCreate =
      sheetStatus === "new" &&
      Boolean(data.customer_name && data.phone && data.city && data.items && Number.isFinite(total));
    if (!canCreate || !orderStatus) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const phone = toE164(data.phone || "");
    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@guest.sahraaaaaaaaaaa.shop`,
          phone,
          firstName: data.customer_name || "عميل",
          lastName: "",
          passwordHash: "cod_guest_order_no_password",
          role: "CUSTOMER",
          country: "SA",
          currency: "SAR",
        },
      });
    }

    const created = await prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        userId: user.id,
        status: orderStatus,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: "PENDING",
        subtotal: total,
        shippingCost: 0,
        discount: 0,
        total,
        currency: "SAR",
        shippingAddress: {
          firstName: data.customer_name,
          phone,
          city: data.city,
          country: "SA",
        },
        notes: itemsText(data.items),
        phoneE164: phone,
        confirmationState: ConfirmationState.AWAITING,
        confirmationNotes: data.confirmationNotes,
        courierName: data.courier,
        trackingNumber: data.trackingNumber,
        statusHistory: { create: { status: orderStatus, note: "Created from Google Sheet" } },
      },
    });

    return NextResponse.json({ success: true, data: { id: created.id, orderNumber: created.orderNumber } });
  }

  const confirmation = confirmationFor(sheetStatus);
  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: {
      ...(orderStatus ? { status: orderStatus } : {}),
      ...(confirmation ? { confirmationState: confirmation } : {}),
      ...(data.confirmationNotes !== undefined ? { confirmationNotes: data.confirmationNotes } : {}),
      ...(data.courier !== undefined ? { courierName: data.courier } : {}),
      ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
      ...(orderStatus === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      ...(orderStatus
        ? { statusHistory: { create: { status: orderStatus, note: `Sheet status ${sheetStatus}` } } }
        : {}),
    },
  });

  return NextResponse.json({ success: true, data: { id: updated.id, orderNumber: updated.orderNumber } });
}
