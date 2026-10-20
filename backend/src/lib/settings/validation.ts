import { z } from "zod";

const emptyToNull = (v: string | null | undefined) =>
  !v || v === "" ? null : v;

const optionalUrl = z
  .union([z.string().url("Invalid URL"), z.literal(""), z.null()])
  .optional()
  .transform(emptyToNull);

const optionalEmail = z
  .union([z.string().email("Invalid email"), z.literal(""), z.null()])
  .optional()
  .transform(emptyToNull);

const optionalPhone = z
  .union([z.string().max(30), z.literal(""), z.null()])
  .optional()
  .transform(emptyToNull);

const optionalDomain = z
  .union([z.string().max(255), z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (!v || v === "") return null;
    return v.replace(/^https?:\/\//, "").replace(/\/$/, "");
  });

const optionalImagePath = z
  .union([z.string().max(500), z.literal(""), z.null()])
  .optional()
  .transform(emptyToNull);

export const updateSiteSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(100),
  siteDescription: z.string().min(1, "Site description is required").max(500),
  siteLogo: optionalImagePath,
  siteFavicon: optionalImagePath,
  domainName: optionalDomain,
  supportEmail: optionalEmail,
  supportPhone: optionalPhone,
  whatsappNumber: optionalPhone,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  snapchatUrl: optionalUrl,
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  twitterUrl: optionalUrl,
  returnShippingCostDefault: z.number().min(0).optional(),
  returnShippingBearer: z.enum(["CUSTOMER", "STORE"]).optional(),
  returnDeductShipping: z.boolean().optional(),
  returnWindowDays: z.number().int().min(1).max(365).optional(),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
