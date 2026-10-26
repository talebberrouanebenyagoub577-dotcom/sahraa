export interface ShippingContact {
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  city: string;
  street: string;
}

export function readShippingContact(value: unknown): ShippingContact {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const firstName = String(row.firstName || "").trim();
  const lastName = String(row.lastName || "").trim();
  return {
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    phone: String(row.phone || "").trim(),
    city: String(row.city || "").trim(),
    street: String(row.street || "").trim(),
  };
}

export function adminCustomerOf(order: {
  shippingAddress: unknown;
  phoneE164?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; phone?: string | null } | null;
}): { fullName: string; phone: string; city: string } {
  const address = readShippingContact(order.shippingAddress);
  const userName = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ");
  return {
    fullName: address.fullName || userName || "",
    phone: address.phone || order.phoneE164 || order.user?.phone || "",
    city: address.city,
  };
}

export function variantOptions(variant?: { size?: string | null; color?: string | null } | null): {
  size: string | null;
  color: string | null;
} {
  const size = variant?.size?.trim() || "";
  const color = variant?.color?.trim() || "";
  return { size: size || null, color: color || null };
}

export interface AdminListItem {
  name?: string | null;
  nameAr?: string | null;
  quantity: number;
  price?: number;
  size?: string | null;
  color?: string | null;
}

export function toAdminListRow(order: {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod?: string | null;
  total: number;
  currency?: string | null;
  createdAt: Date | string;
  items: AdminListItem[];
  shippingAddress: unknown;
  phoneE164?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; phone?: string | null } | null;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod || "COD",
    total: order.total,
    currency: order.currency || "SAR",
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    customer: adminCustomerOf(order),
    items: order.items.map((item) => ({
      name: item.name || "",
      nameAr: item.nameAr || "",
      quantity: item.quantity,
      price: item.price,
      size: item.size || null,
      color: item.color || null,
    })),
  };
}

export function parsePageLimit(searchParams: URLSearchParams, defaultLimit = 10) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit));
  return { page, limit };
}

export function logOrderError(stage: string, error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : "";
  const name = error instanceof Error ? error.name : "unknown";
  console.error(`[orders.${stage}]`, name, code);
}
