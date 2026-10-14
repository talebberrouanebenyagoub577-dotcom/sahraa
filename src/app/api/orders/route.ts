import { NextRequest, after } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest, requireRole, ADMIN_ROLES } from "@/lib/auth/middleware";
import { signAccessToken } from "@/lib/auth/jwt";
import { checkoutSchema } from "@/lib/validations/order";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { generateOrderNumber } from "@/lib/utils";
import { getCurrencyForCountry } from "@/lib/utils";
import {
  PRODUCT_UNIT_PRICE,
  UPSELL_SPECIAL_PRICE,
  calculateTierPrice,
  FREE_SHIPPING_COST,
} from "@/lib/pricing";
import { PaymentMethod } from "@prisma/client";
import { appendOrderToGoogleSheet, SheetOrderItem } from "@/lib/services/googleSheet";

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
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    if (data.paymentMethod !== PaymentMethod.COD) {
      return apiError("Only Cash on Delivery is currently available", 400);
    }

    // 1. Resolve User (Logged-in or Seamless Guest for COD GCC market)
    const auth = getAuthFromRequest(request);
    let userId = auth?.user?.userId;
    let authCookieToken: string | null = null;

    const rawPhone = data.shippingAddress.phone.replace(/[\s\-\(\)]/g, "");
    const customerName = data.shippingAddress.firstName.trim();

    if (!userId) {
      // Find or create customer account by phone
      let user = await prisma.user.findFirst({
        where: { phone: rawPhone },
      });

      if (!user) {
        const uniqueEmail = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@guest.sahraa.store`;
        user = await prisma.user.create({
          data: {
            email: uniqueEmail,
            phone: rawPhone,
            firstName: customerName,
            lastName: "",
            passwordHash: "cod_guest_order_no_password",
            role: "CUSTOMER",
            country: data.shippingAddress.country,
            currency: "SAR",
          },
        });
      }

      userId = user.id;
      authCookieToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    }

    // 2. Resolve Items (Direct payload or DB Cart)
    interface ResolvedLineItem {
      productId: string;
      variantId?: string | null;
      quantity: number;
      product: {
        id: string;
        name: string;
        nameAr: string;
        price: number;
        sku: string;
        sellerId: string;
        inventoryQuantity: number;
      };
      variant?: {
        id: string;
        sku: string;
        price?: number | null;
        stock: number;
      } | null;
      isUpsell?: boolean;
    }

    const resolvedItems: ResolvedLineItem[] = [];
    let cartIdToDelete: string | null = null;
    let cartItemIdsToDelete: string[] = [];

    if (data.items && data.items.length > 0) {
      // Resolve items from request body directly
      const productIds = [
        ...new Set(data.items.map((i) => i.productId)),
      ];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, status: "APPROVED" },
        include: { inventory: true },
      });
      const prodMap = new Map(products.map((p) => [p.id, p]));

      const variantIds = data.items
        .map((i) => i.variantId)
        .filter((id): id is string => Boolean(id));
      const variants =
        variantIds.length > 0
          ? await prisma.productVariant.findMany({
              where: { id: { in: variantIds }, isActive: true },
            })
          : [];
      const varMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of data.items) {
        const prod = prodMap.get(item.productId);
        if (!prod) continue;
        const variant = item.variantId ? varMap.get(item.variantId) : null;
        resolvedItems.push({
          productId: prod.id,
          variantId: variant?.id || null,
          quantity: item.quantity,
          product: {
            id: prod.id,
            name: prod.name,
            nameAr: prod.nameAr,
            price: prod.price,
            sku: prod.sku,
            sellerId: prod.sellerId,
            inventoryQuantity: prod.inventory?.quantity || 999,
          },
          variant,
        });
      }
    } else {
      // Fallback to DB Cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: { include: { inventory: true } },
            },
          },
        },
      });

      if (cart && cart.items.length > 0) {
        cartIdToDelete = cart.id;
        cartItemIdsToDelete = cart.items.map((i) => i.id);

        const variantIds = cart.items
          .map((i) => i.variantId)
          .filter((id): id is string => Boolean(id));
        const variants =
          variantIds.length > 0
            ? await prisma.productVariant.findMany({
                where: { id: { in: variantIds }, isActive: true },
              })
            : [];
        const varMap = new Map(variants.map((v) => [v.id, v]));

        for (const item of cart.items) {
          const variant = item.variantId ? varMap.get(item.variantId) : null;
          resolvedItems.push({
            productId: item.productId,
            variantId: variant?.id || null,
            quantity: item.quantity,
            product: {
              id: item.product.id,
              name: item.product.name,
              nameAr: item.product.nameAr,
              price: item.product.price,
              sku: item.product.sku,
              sellerId: item.product.sellerId,
              inventoryQuantity: item.product.inventory?.quantity || 999,
            },
            variant,
          });
        }
      }
    }

    if (resolvedItems.length === 0) {
      return apiError("Cart is empty", 400);
    }

    // 3. Resolve Upsell Product (if customer accepted OTO upsell)
    let upsellProductRecord: {
      id: string;
      name: string;
      nameAr: string;
      sku: string;
      sellerId: string;
    } | null = null;

    if (data.upsellProductId) {
      const p = await prisma.product.findUnique({
        where: { id: data.upsellProductId, status: "APPROVED" },
      });
      if (p) {
        upsellProductRecord = {
          id: p.id,
          name: p.name,
          nameAr: p.nameAr,
          sku: p.sku,
          sellerId: p.sellerId,
        };
      }
    }

    // 4. Calculate Volumes & Pricing Strictly According to Rules:
    // 1 item: 199 SAR
    // 2 items: 279 SAR
    // 3 items: 349 SAR
    // Upsell: 99 SAR
    const regularItemCount = resolvedItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );
    const regularTierPrice = calculateTierPrice(regularItemCount);
    const regularStandardSubtotal = regularItemCount * PRODUCT_UNIT_PRICE;
    const regularDiscount = Math.max(0, regularStandardSubtotal - regularTierPrice);

    const hasUpsell = Boolean(upsellProductRecord);
    const upsellPrice = hasUpsell ? UPSELL_SPECIAL_PRICE : 0;

    const subtotal = regularStandardSubtotal + upsellPrice;
    const discount = regularDiscount;
    const shippingCost = FREE_SHIPPING_COST;
    const total = regularTierPrice + upsellPrice;
    const currency = getCurrencyForCountry(data.shippingAddress.country);

    // 5. Execute DB Transaction
    const order = await prisma.$transaction(async (tx) => {
      // Clear DB cart if applicable
      if (cartIdToDelete && cartItemIdsToDelete.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: cartIdToDelete,
            id: { in: cartItemIdsToDelete },
          },
        });
      }

      // Build Order Items
      const orderItemsData = resolvedItems.map((item) => ({
        productId: item.productId,
        sellerId: item.product.sellerId,
        variantId: item.variantId || undefined,
        name: item.product.name,
        nameAr: item.product.nameAr,
        sku: item.variant?.sku ?? item.product.sku,
        price: PRODUCT_UNIT_PRICE,
        quantity: item.quantity,
        total: PRODUCT_UNIT_PRICE * item.quantity,
      }));

      // Add Upsell as distinct line item if present
      if (upsellProductRecord) {
        orderItemsData.push({
          productId: upsellProductRecord.id,
          sellerId: upsellProductRecord.sellerId,
          variantId: undefined,
          name: `${upsellProductRecord.name} (عرض خاص)`,
          nameAr: `${upsellProductRecord.nameAr} (عرض خاص 99 ريال)`,
          sku: upsellProductRecord.sku,
          price: UPSELL_SPECIAL_PRICE,
          quantity: 1,
          total: UPSELL_SPECIAL_PRICE,
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          subtotal,
          shippingCost,
          discount,
          total,
          currency,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: { status: "PENDING", note: "Order placed via COD" },
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
        },
      });

      // Update sold counts
      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }
      if (upsellProductRecord) {
        await tx.product.update({
          where: { id: upsellProductRecord.id },
          data: { soldCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // 6. Send Order to Google Sheet Webhook / Log
    const sheetItems: SheetOrderItem[] = resolvedItems.map((item) => ({
      name: item.product.nameAr || item.product.name,
      quantity: item.quantity,
      price: PRODUCT_UNIT_PRICE,
      isUpsell: false,
    }));
    if (upsellProductRecord) {
      sheetItems.push({
        name: upsellProductRecord.nameAr || upsellProductRecord.name,
        quantity: 1,
        price: UPSELL_SPECIAL_PRICE,
        isUpsell: true,
      });
    }

    const sheetPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      customerName,
      customerPhone: rawPhone,
      city: data.shippingAddress.city || "المملكة العربية السعودية",
      country: data.shippingAddress.country,
      items: sheetItems,
      hasUpsell,
      upsellProduct: upsellProductRecord
        ? upsellProductRecord.nameAr || upsellProductRecord.name
        : undefined,
      subtotal,
      discount,
      shipping: 0,
      total,
      paymentMethod: "COD",
      status: "PENDING",
    };
    after(() => appendOrderToGoogleSheet(sheetPayload, "order.created"));

    // 7. Return Success with Access Token Cookie for Guest Session
    const response = apiSuccess(order, 201);
    if (authCookieToken) {
      response.cookies.set("access_token", authCookieToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof CheckoutError) {
      return apiError(error.message, error.status);
    }
    return handleApiError(error);
  }
}
