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
