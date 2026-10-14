import prisma from "@/lib/prisma";

export const PLATFORM_STORE_SLUG = "sahraa-official-store";

/** Seller profile used for all admin-created catalog products */
export async function getPlatformSellerId(): Promise<string> {
  const existing = await prisma.sellerProfile.findUnique({
    where: { slug: PLATFORM_STORE_SLUG },
    select: { id: true },
  });
  if (existing) return existing.id;

  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No SUPER_ADMIN user found. Run db:seed first.");
  }

  const profile = await prisma.sellerProfile.create({
    data: {
      userId: admin.id,
      storeName: "SAHRAA Store",
      storeNameAr: "متجر صحرا",
      slug: PLATFORM_STORE_SLUG,
      description: "Official SAHRAA catalog",
      descriptionAr: "المتجر الرسمي لمنصة صحرا",
      status: "APPROVED",
      approvedAt: new Date(),
    },
    select: { id: true },
  });

  return profile.id;
}
