import { z } from "zod";
import { PaymentMethod, CountryCode } from "@prisma/client";

export const addressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.nativeEnum(CountryCode),
  isDefault: z.boolean().default(false),
});

export const checkoutAddressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  city: z.string().optional(),
  street: z.string().optional(),
  country: z.nativeEnum(CountryCode).default(CountryCode.SA),
});

export const checkoutItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const attributionSchema = z.object({
  fbc: z.string().max(500).optional(),
  fbp: z.string().max(500).optional(),
  fbclid: z.string().max(500).optional(),
  ttclid: z.string().max(500).optional(),
  ttp: z.string().max(500).optional(),
  sc_click_id: z.string().max(500).optional(),
  sc_cookie1: z.string().max(500).optional(),
  utm_source: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  eventSourceUrl: z.string().max(2000).optional(),
});

export const checkoutSchema = z.object({
  shippingAddress: checkoutAddressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.COD),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(checkoutItemSchema).optional(),
  upsellProductId: z.string().optional().nullable(),
  attribution: attributionSchema.optional(),
  deviceId: z.string().trim().min(8).max(80).optional(),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});
