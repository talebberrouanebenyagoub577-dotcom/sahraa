import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.enum(["SA", "AE", "KW", "QA", "BH", "OM"]),
  isDefault: z.boolean().default(false),
});

export const checkoutAddressSchema = z.object({
  label: z.string().default("Home"),
  firstName: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  city: z.string().optional(),
  street: z.string().optional(),
  country: z.enum(["SA", "AE", "KW", "QA", "BH", "OM"]).default("SA"),
});

export const checkoutItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const checkoutSchema = z.object({
  shippingAddress: checkoutAddressSchema,
  paymentMethod: z.enum(["COD", "STRIPE", "PAYPAL"]).default("COD"),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(checkoutItemSchema).optional(),
  upsellProductId: z.string().optional().nullable(),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
});
