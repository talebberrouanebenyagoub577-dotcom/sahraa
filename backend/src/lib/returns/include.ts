export const returnInclude = {
  items: true,
  refund: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      total: true,
      shippingCost: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
      createdAt: true,
      deliveredAt: true,
      shippingAddress: true,
      userId: true,
    },
  },
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
} as const;

export function customerPhone(
  user: { phone: string | null },
  shippingAddress: unknown,
): string {
  const fromAddress =
    shippingAddress && typeof shippingAddress === "object"
      ? String((shippingAddress as { phone?: string }).phone || "")
      : "";
  return user.phone || fromAddress || "";
}

export function hideInternalNotes<T extends { internalNotes?: string | null }>(
  row: T,
  isAdmin: boolean,
): T {
  if (isAdmin) return row;
  return { ...row, internalNotes: null };
}
