import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { checkoutSchema } from "@/lib/validations/order";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { generateOrderNumber, calculateDiscount } from "@/lib/utils";
import { getCurrencyForCountry } from "@/lib/utils";
import { cartItemCount, quoteOfferTotals } from "@/lib/pricing";
import { PaymentMethod } from "@prisma/client";

class CheckoutError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");

    const userId = auth.user.userId;
    const isAdmin = requireRole(auth, ADMIN_ROLES);
    const where = isAdmin
      ? { ...(status ? { status: status as never } : {}) }
      : { userId, ...(status ? { status: status as never } : {}) };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return apiSuccess({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const body = await request.json();
    const data = checkoutSchema.parse(body);
    if (data.paymentMethod !== PaymentMethod.COD) {
      return apiError("Only Cash on Delivery is currently available", 400);
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: auth.user.userId },
      include: {
        items: {
          include: {
            product: { include: { inventory: true, seller: true } },
          },
        },
        coupon: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return apiError("Cart is empty", 400);
    }

    const variantIds = cart.items
      .map((item) => item.variantId)
      .filter((id): id is string => Boolean(id));
    const variants =
      variantIds.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIds }, isActive: true },
          })
        : [];
    const variantMap = new Map(
      variants.map((variant) => [variant.id, variant])
    );

    for (const item of cart.items) {
      const variant = item.variantId
        ? variantMap.get(item.variantId)
        : undefined;
      if (
        item.variantId &&
        (!variant || variant.productId !== item.productId)
      ) {
        return apiError(`Selected option is unavailable for ${item.product.name}`, 400);
      }
      const productStock = item.product.inventory?.quantity || 0;
      const stock = variant
        ? Math.min(productStock, variant.stock)
        : productStock;
      if (stock < item.quantity) {
        return apiError(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => {
        const variant = item.variantId
          ? variantMap.get(item.variantId)
          : undefined;
        return sum + (variant?.price ?? item.product.price) * item.quantity;
      },
      0
    );

    const itemCount = cartItemCount(cart.items);
    const beforeCoupon = quoteOfferTotals(subtotal, itemCount);
    let couponDiscount = 0;
    let couponId: string | undefined;
    let incrementCouponId: string | undefined;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode },
      });
      if (coupon?.isActive) {
        couponDiscount = calculateDiscount(
          beforeCoupon.total,
          coupon.discountType,
          coupon.discountValue,
          coupon.maxDiscount
        );
        couponId = coupon.id;
        incrementCouponId = coupon.id;
      }
    } else if (cart.coupon) {
      couponDiscount = calculateDiscount(
        beforeCoupon.total,
        cart.coupon.discountType,
        cart.coupon.discountValue,
        cart.coupon.maxDiscount
      );
      couponId = cart.coupon.id;
    }

    const offer = quoteOfferTotals(subtotal, itemCount, couponDiscount);
    const discount = offer.discount;
    const shippingCost = offer.shippingCost;
    const total = offer.total;
    const currency = getCurrencyForCountry(data.shippingAddress.country);

    const order = await prisma.$transaction(async (tx) => {
      // Claiming the cart rows first serializes concurrent submissions of the
      // same cart: the losing request deletes nothing and rolls back.
      const claimed = await tx.cartItem.deleteMany({
        where: { cartId: cart.id, id: { in: cart.items.map((item) => item.id) } },
      });
      if (claimed.count !== cart.items.length) {
        throw new CheckoutError("This order has already been submitted", 409);
      }

      if (incrementCouponId) {
        await tx.coupon.update({
          where: { id: incrementCouponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: auth.user.userId,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          subtotal,
          shippingCost,
          discount,
          total,
          currency,
          couponId,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          items: {
            create: cart.items.map((item) => {
              const variant = item.variantId
                ? variantMap.get(item.variantId)
                : undefined;
              const unitPrice = variant?.price ?? item.product.price;
              return {
                productId: item.productId,
                sellerId: item.product.sellerId,
                variantId: item.variantId || undefined,
                name: item.product.name,
                nameAr: item.product.nameAr,
                sku: variant?.sku ?? item.product.sku,
                price: unitPrice,
                quantity: item.quantity,
                total: unitPrice * item.quantity,
              };
            }),
          },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed" },
          },
        },
        include: { items: true },
      });

      for (const item of cart.items) {
        const inventoryUpdate = await tx.inventory.updateMany({
          where: {
            productId: item.productId,
            quantity: { gte: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        });
        if (inventoryUpdate.count !== 1) {
          throw new CheckoutError(`Insufficient stock for ${item.product.name}`);
        }

        if (item.variantId) {
          const variantUpdate = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              isActive: true,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantUpdate.count !== 1) {
            throw new CheckoutError(`Selected option is unavailable for ${item.product.name}`);
          }
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      await tx.notification.create({
        data: {
          userId: auth.user.userId,
          title: "Order Placed",
          titleAr: "تم تأكيد الطلب",
          message: `Your order ${newOrder.orderNumber} has been placed`,
          messageAr: `تم تأكيد طلبك رقم ${newOrder.orderNumber}`,
          type: "order",
          link: `/dashboard/customer/orders/${newOrder.id}`,
        },
      });

      return newOrder;
    });

    return apiSuccess(order, 201);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return apiError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
