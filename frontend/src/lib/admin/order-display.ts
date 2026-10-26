export function readAdminOrders(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const root = body as { data?: unknown; orders?: unknown };
  const data = root.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const orders = (data as { orders?: unknown }).orders;
    if (Array.isArray(orders)) return orders;
  }
  if (Array.isArray(root.orders)) return root.orders;
  return [];
}

export function formatAdminItemLine(
  item: {
    name?: string | null;
    nameAr?: string | null;
    quantity: number;
    size?: string | null;
    color?: string | null;
  },
  locale: string
): string {
  const name = locale === "ar" ? item.nameAr || item.name || "" : item.name || item.nameAr || "";
  const extras = [item.size, item.color].filter(Boolean).join(" / ");
  const qty = `×${item.quantity}`;
  return extras ? `${name} ${qty} (${extras})` : `${name} ${qty}`;
}
