import prisma from "@/lib/prisma";
import { adminCustomerOf, variantOptions } from "@/lib/orders/admin-view";

type ItemWithVariant = { variantId?: string | null };

export async function withItemVariants<T extends { items: ItemWithVariant[] }>(
  orders: T[]
): Promise<Array<T & { items: Array<T["items"][number] & { size: string | null; color: string | null }> }>> {
  const ids = [
    ...new Set(orders.flatMap((order) => order.items.map((item) => item.variantId).filter(Boolean))),
  ] as string[];
  const variants = ids.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: ids } },
        select: { id: true, size: true, color: true },
      })
    : [];
  const map = new Map(variants.map((row) => [row.id, row]));
  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      ...variantOptions(item.variantId ? map.get(item.variantId) : null),
    })),
  }));
}

export function withAdminCustomer<
  T extends {
    shippingAddress: unknown;
    phoneE164?: string | null;
    user?: { firstName?: string | null; lastName?: string | null; phone?: string | null } | null;
  },
>(order: T) {
  return { ...order, customer: adminCustomerOf(order) };
}
