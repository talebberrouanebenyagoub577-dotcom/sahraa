import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { cartItemSchema } from "@/lib/validations/order";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { calculateDiscount } from "@/lib/utils";
import { cartItemCount, quoteOfferTotals } from "@/lib/pricing";

const productInclude = {
  images: { where: { isPrimary: true }, take: 1 },
  seller: { select: { storeName: true, storeNameAr: true } },
  inventory: true,
};

async function getCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: { include: { product: { include: productInclude } } },
      coupon: true,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: { include: { product: { include: productInclude } } },
        coupon: true,
      },
    });
  }

  const variantIds = cart.items
    .map((item) => item.variantId)
    .filter((id): id is string => Boolean(id));
  const variants =
    variantIds.length > 0
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
        })
      : [];
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      variant: item.variantId ? variantMap.get(item.variantId) || null : null,
    })),
  };
}

function itemUnitPrice(
  item: Awaited<ReturnType<typeof getCart>>["items"][number]
) {
  return item.variant?.price ?? item.product.price;
}

function itemAvailableStock(
  item: Awaited<ReturnType<typeof getCart>>["items"][number]
) {
  const productStock = item.product.inventory?.quantity ?? 0;
  return item.variant
    ? Math.min(productStock, item.variant.stock)
    : productStock;
}

function buildSummary(cart: Awaited<ReturnType<typeof getCart>>) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + itemUnitPrice(item) * item.quantity,
    0
  );
  const itemCount = cartItemCount(cart.items);
  const beforeCoupon = quoteOfferTotals(subtotal, itemCount);
  let couponDiscount = 0;
  if (cart.coupon?.isActive) {
    couponDiscount = calculateDiscount(
      beforeCoupon.total,
      cart.coupon.discountType,
      cart.coupon.discountValue,
      cart.coupon.maxDiscount
    );
  }
  const offer = quoteOfferTotals(subtotal, itemCount, couponDiscount);
  return {
    subtotal: offer.subtotal,
    discount: offer.discount,
    bundleDiscount: offer.bundleDiscount,
    shippingCost: offer.shippingCost,
    remainingToBundle: offer.remainingToBundle,
    total: offer.total,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const cart = await getCart(auth.user.userId);
    const vendors = [
      ...new Set(cart.items.map((item) => item.product.seller?.storeName)),
    ];
    return apiSuccess({
      ...cart,
      summary: { ...buildSummary(cart), vendors },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const { productId, variantId, quantity } = cartItemSchema.parse(
      await request.json()
    );
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        inventory: true,
        variants: { where: { isActive: true } },
      },
    });
    if (!product || product.status !== "APPROVED") {
      return apiError("Product not available", 400);
    }

    const requiresVariant = product.variants.length > 0;
    const variant = variantId
      ? product.variants.find((item) => item.id === variantId)
      : undefined;
    if (requiresVariant && !variantId) {
      return apiError("Please select a product option", 400);
    }
    if (variantId && !variant) {
      return apiError("Selected option is not available for this product", 400);
    }

    const cart = await getCart(auth.user.userId);
    const existing = cart.items.find(
      (item) =>
        item.productId === productId &&
        item.variantId === (variantId || null)
    );
    const requestedQuantity = (existing?.quantity ?? 0) + quantity;
    const productStock = product.inventory?.quantity ?? 0;
    const available = variant
      ? Math.min(productStock, variant.stock)
      : productStock;
    if (available < requestedQuantity) {
      return apiError("Insufficient stock", 400);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: requestedQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    const updatedCart = await getCart(auth.user.userId);
    return apiSuccess(
      { ...updatedCart, summary: buildSummary(updatedCart) },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const body = await request.json();
    const cart = await getCart(auth.user.userId);

    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: String(body.couponCode) },
      });
      if (!coupon?.isActive) return apiError("Invalid coupon", 400);
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return apiError("Coupon expired", 400);
      }
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponId: coupon.id },
      });
    }

    if (body.itemId && body.quantity !== undefined) {
      const quantity = Number(body.quantity);
      if (!Number.isInteger(quantity) || quantity > 99) {
        return apiError("Invalid quantity", 400);
      }
      const item = cart.items.find((entry) => entry.id === body.itemId);
      if (!item) return apiError("Cart item not found", 404);

      if (quantity < 1) {
        await prisma.cartItem.delete({ where: { id: item.id } });
      } else {
        if (quantity > itemAvailableStock(item)) {
          return apiError("Insufficient stock", 400);
        }
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { quantity },
        });
      }
    }

    const updatedCart = await getCart(auth.user.userId);
    return apiSuccess({
      ...updatedCart,
      summary: buildSummary(updatedCart),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) return apiError("Unauthorized", 401);

    const itemId = new URL(request.url).searchParams.get("itemId");
    const cart = await prisma.cart.findUnique({
      where: { userId: auth.user.userId },
      select: { id: true },
    });
    if (!cart) {
      return apiSuccess({
        items: [],
        summary: quoteOfferTotals(0, 0),
      });
    }

    if (itemId) {
      const item = await prisma.cartItem.findFirst({
        where: { id: itemId, cartId: cart.id },
        select: { id: true },
      });
      if (!item) return apiError("Cart item not found", 404);
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    const updatedCart = await getCart(auth.user.userId);
    return apiSuccess({
      ...updatedCart,
      summary: buildSummary(updatedCart),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
