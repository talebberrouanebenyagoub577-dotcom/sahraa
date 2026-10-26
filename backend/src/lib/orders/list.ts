import prisma from "@/lib/prisma";
import { toAdminListRow } from "./admin-view";
import { withItemVariants } from "./attach-variants";

export const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  total: true,
  currency: true,
  createdAt: true,
  shippingAddress: true,
  phoneE164: true,
  items: {
    select: {
      id: true,
      name: true,
      nameAr: true,
      quantity: true,
      price: true,
      total: true,
      sku: true,
      variantId: true,
    },
  },
  user: { select: { firstName: true, lastName: true, phone: true } },
} as const;

export async function loadOrderList(input: {
  isAdmin: boolean;
  userId: string;
  page: number;
  limit: number;
  status?: string | null;
}) {
  const where = input.isAdmin
    ? { ...(input.status ? { status: input.status as never } : {}) }
    : { userId: input.userId, ...(input.status ? { status: input.status as never } : {}) };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderListSelect,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    }),
    prisma.order.count({ where }),
  ]);

  const withVariants = await withItemVariants(orders);
  const payload = input.isAdmin ? withVariants.map((order) => toAdminListRow(order)) : withVariants;

  console.info("[orders.list]", {
    scope: input.isAdmin ? "admin" : "customer",
    total,
    returned: payload.length,
    page: input.page,
    limit: input.limit,
  });

  return {
    orders: payload,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit) || 0,
    },
  };
}
