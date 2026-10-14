import { PrismaClient, UserRole, CountryCode } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SAHRAA database...");

  const passwordHash = await bcrypt.hash("Sahraa@2026", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@sahraa.com" },
    update: {},
    create: {
      email: "admin@sahraa.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      cart: { create: {} },
      loyaltyPoints: { create: {} },
    },
  });

  await prisma.sellerProfile.upsert({
    where: { slug: "sahraa-official-store" },
    update: { status: "APPROVED", approvedAt: new Date() },
    create: {
      userId: superAdmin.id,
      storeName: "SAHRAA Store",
      storeNameAr: "متجر صحرا",
      slug: "sahraa-official-store",
      description: "Official SAHRAA catalog",
      descriptionAr: "المتجر الرسمي لمنصة صحرا",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@sahraa.com" },
    update: {},
    create: {
      email: "seller@sahraa.com",
      passwordHash,
      firstName: "أحمد",
      lastName: "المتجر",
      role: UserRole.SELLER,
      emailVerified: true,
      cart: { create: {} },
      loyaltyPoints: { create: {} },
      sellerProfile: {
        create: {
          storeName: "Tech Gulf Store",
          storeNameAr: "متجر الخليج التقني",
          slug: "tech-gulf-store",
          description: "Premium electronics and gadgets",
          descriptionAr: "إلكترونيات وأجهزة متميزة",
          status: "APPROVED",
          approvedAt: new Date(),
          rating: 4.8,
        },
      },
    },
    include: { sellerProfile: true },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@sahraa.com" },
    update: {},
    create: {
      email: "customer@sahraa.com",
      passwordHash,
      firstName: "محمد",
      lastName: "العميل",
      role: UserRole.CUSTOMER,
      phone: "+966501234567",
      emailVerified: true,
      cart: { create: {} },
      loyaltyPoints: { create: { points: 150, lifetime: 150 } },
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: {
        name: "Electronics",
        nameAr: "إلكترونيات",
        slug: "electronics",
        icon: "📱",
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: "fashion" },
      update: {},
      create: {
        name: "Fashion",
        nameAr: "أزياء",
        slug: "fashion",
        icon: "👗",
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: "home" },
      update: {},
      create: {
        name: "Home & Living",
        nameAr: "المنزل والمعيشة",
        slug: "home",
        icon: "🏠",
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: "beauty" },
      update: {},
      create: {
        name: "Beauty",
        nameAr: "جمال",
        slug: "beauty",
        icon: "💄",
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: "sports" },
      update: {},
      create: {
        name: "Sports",
        nameAr: "رياضة",
        slug: "sports",
        icon: "⚽",
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: "kids" },
      update: {},
      create: {
        name: "Kids",
        nameAr: "أطفال",
        slug: "kids",
        icon: "🧸",
        sortOrder: 6,
      },
    }),
  ]);

  // Demo products removed — add real products via admin/seller or a custom import script.

  await prisma.banner.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Summer Sale - Up to 50% Off",
        titleAr: "تخفيضات الصيف - حتى 50%",
        subtitle: "Shop now with Cash on Delivery",
        subtitleAr: "تسوق الآن مع الدفع عند الاستلام",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=450&fit=crop",
        sortOrder: 1,
      },
      {
        title: "New Electronics Collection",
        titleAr: "مجموعة الإلكترونيات الجديدة",
        subtitle: "Latest gadgets at best prices",
        subtitleAr: "أحدث الأجهزة بأفضل الأسعار",
        image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=450&fit=crop",
        sortOrder: 2,
      },
      {
        title: "Any 3 different products for 399 SAR",
        titleAr: "أي 3 منتجات مختلفة بـ 399 ريال",
        subtitle: "Mix and match any products. One item is 199 SAR with free delivery",
        subtitleAr: "اختَر منتجات مختلفة. المنتج الواحد بـ 199 ريال والتوصيل مجاني",
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=450&fit=crop",
        sortOrder: 3,
      },
    ],
  });

  await prisma.coupon.upsert({
    where: { code: "SAHRAA10" },
    update: {},
    create: {
      code: "SAHRAA10",
      description: "10% off your first order",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 100,
      maxDiscount: 50,
      usageLimit: 1000,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "Gulf Suppliers Co.",
      nameAr: "شركة موردي الخليج",
      email: "supplier@gulfsuppliers.com",
      phone: "+966112345678",
      country: CountryCode.SA,
    },
  });

  await prisma.cODOffer.create({
    data: {
      supplierId: supplier.id,
      title: "Standard COD Commission",
      titleAr: "عمولة COD القياسية",
      commissionRate: 12,
      countries: [CountryCode.SA, CountryCode.AE, CountryCode.KW],
      isActive: true,
    },
  });

  await prisma.shippingCompany.createMany({
    data: [
      { name: "Aramex", provider: "ARAMEX", countries: [CountryCode.SA, CountryCode.AE, CountryCode.KW, CountryCode.QA, CountryCode.BH, CountryCode.OM] },
      { name: "SMSA Express", provider: "SMSA", countries: [CountryCode.SA] },
      { name: "J&T Express", provider: "JT", countries: [CountryCode.SA, CountryCode.AE] },
      { name: "DHL", provider: "DHL", countries: [CountryCode.SA, CountryCode.AE, CountryCode.KW, CountryCode.QA, CountryCode.BH, CountryCode.OM] },
    ],
  });

  await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "SAHRAA",
      siteDescription:
        "The premier COD marketplace in the GCC region. Shop electronics, fashion, home & more with Cash on Delivery across Saudi Arabia, UAE, Kuwait, Qatar, Bahrain & Oman.",
      supportEmail: "support@sahraa.com",
      supportPhone: "+966 11 000 0000",
      whatsappNumber: "+966500000000",
      instagramUrl: "https://instagram.com/sahraa",
      twitterUrl: "https://twitter.com/sahraa",
    },
  });

  console.log("✅ Seed completed!");
  console.log("");
  console.log("📧 Demo Accounts:");
  console.log("   Admin:    admin@sahraa.com / Sahraa@2026");
  console.log("   Seller:   seller@sahraa.com / Sahraa@2026");
  console.log("   Customer: customer@sahraa.com / Sahraa@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
