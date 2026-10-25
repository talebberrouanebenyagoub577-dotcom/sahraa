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
