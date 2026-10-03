import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "deep-cera-vitamin-illuminating-serum";
const sku = "SAHRAA-DEEP-CERA-VITAMIN-SERUM";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_watermarked_img_6356861351436802990-3175ced0-8765-4d0f-b5b9-2f0c3f59bef7.jpg",
    filename: "product.jpg",
    alt: "عرض استوديو متكامل ونظيف يُظهر عبوة وقارورة DEEP CERA VITAMIN illuminating Serum بحجم 30 مل ومكوناته الأساسية",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_4870b293-7b8c-46a9-9457-ab085b909f20-2b143959-d4f8-4d72-80c7-6668ae8f04ca.jpg",
    filename: "beauty.jpg",
    alt: "إطلالة جمالية تُبرز مظهر البشرة المروية والمتألقة (Glass Skin) بجانب سيروم ديب سيرا",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_35215c38-6487-4f21-98c6-1addfbdc0435-6ed26b57-d5a6-404b-8713-4689794b6072.jpg",
    filename: "ingredients.jpg",
    alt: "المكونات الأساسية المطبوعة على العبوة: كرز الأسيرولا، النياسيناميد، حمض الترانيكساميك، والسيراميد",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_979834b5-cb8b-40be-8c0e-1c0f09254b8a-df932141-1aae-4dce-95a2-13b6832cee99.jpg",
    filename: "texture.jpg",
    alt: "قوام السيروم الذهبي الشفاف وقطارة الاستخدام الزجاجية",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_d15bb65c-cfff-4092-a380-6186f0a064d7-c993be96-82fa-4b7b-897e-8370c7383f49.jpg",
    filename: "routine.jpg",
    alt: "طريقة الاستخدام السلسة ضمن روتين العناية اليومية بالبشرة (K-Beauty Routine)",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_fa1de179-fd37-49c5-b744-0a9c12c7d2c7-57d973f7-9906-409f-9cdd-cf98ad18ba52.jpg",
    filename: "glow-routine.jpg",
    alt: "روتين لإشراقة أكثر وحيوية متجددة مع سيروم ديب سيرا بالفيتامين",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_3511a235-534a-4b28-9d3a-31e9e91b0909-4ec1581b-e2b0-4cd5-8460-2e404fe0d520.jpg",
    filename: "luxury.jpg",
    alt: "عرض فاخر لسيروم ديب سيرا على قماش الساتان الذهبي اللامع",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_watermarked_img_7605655302109131546-c81e7094-0b0e-442d-83e7-be30246865e2.jpg",
    filename: "fresh.jpg",
    alt: "طابع منعش وحيوي محاط بشرائح البرتقال الطازجة وحبات الأسيرولا وأوراق النباتات الخضراء",
    isPrimary: false,
  },
] as const;

async function main() {
  const publicDir = path.join(process.cwd(), "public", "products", slug);
  await mkdir(publicDir, { recursive: true });

  for (const img of images) {
    const srcPath = path.join(assetsDir, img.source);
    const destPath = path.join(publicDir, img.filename);
    await copyFile(srcPath, destPath);
    console.log(`Copied ${img.filename}`);
  }

  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("SUPER_ADMIN account not found");

  const seller = await prisma.sellerProfile.upsert({
    where: { slug: "sahraa-official-store" },
    update: { status: "APPROVED", approvedAt: new Date() },
    create: {
      userId: admin.id,
      storeName: "SAHRAA Store",
      storeNameAr: "متجر صحرا",
      slug: "sahraa-official-store",
      description: "Official SAHRAA catalog",
      descriptionAr: "المتجر الرسمي لمنصة صحرا",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "beauty" },
    update: { isActive: true },
    create: {
      name: "Beauty",
      nameAr: "الجمال والعناية",
      slug: "beauty",
      icon: "✨",
      isActive: true,
    },
  });

  const productData = {
    sellerId: seller.id,
    categoryId: category.id,
    name: "DEEP CERA Vitamin Illuminating Serum 30ml",
    nameAr: "سيروم ديب سيرا للإشراقة بالفيتامين 30 مل",
    slug,
    description:
      "DEEP CERA VITAMIN illuminating Serum (30ml / 1.01 FL.OZ.) is a lightweight, fast-absorbing daily skincare serum formulated with Acerola, Niacinamide, Tranexamic Acid, and Ceramide. Housed in a premium clear glass bottle with a precise dropper pipette for controlled, clean application. Designed to fit smoothly into your morning and evening skincare routine, delivering gentle hydration and a radiant, fresh-looking complexion. For external cosmetic use only. Please read the original packaging label and ingredients before use.",
    descriptionAr:
      "سيروم ديب سيرا للإشراقة بالفيتامين (DEEP CERA VITAMIN illuminating Serum) بحجم 30 مل (1.01 FL.OZ.) هو سيروم عناية يومي خفيف وسريع الامتصاص، بتركيبة مميزة تجمع بين خلاصة الأسيرولا (Acerola)، والنياسيناميد (Niacinamide)، وحمض الترانيكساميك (Tranexamic Acid)، بالإضافة إلى السيراميد (Ceramide). يأتي في قارورة زجاجية أنيقة مع قطارة عملية تتيح توزيع قطرات السيروم بدقة وسهولة. مثالي للاستعمال ضمن روتين العناية الصباحي والمسائي لمنح البشرة ترطيباً ناعماً ومظهراً مشرقاً وحيوياً. للاستخدام التجميلي الخارجي فقط، يُرجى قراءة الملصق والمكونات على العبوة الأصلية قبل الاستعمال.",
    price: 199,
    compareAtPrice: 249,
    sku,
    codAvailable: true,
    status: "APPROVED" as const,
    isFeatured: true,
    isNewArrival: true,
  };

  const existing = await prisma.product.findUnique({ where: { sku } });

  const productImages = images.map((img, idx) => ({
    url: `/products/${slug}/${img.filename}`,
    alt: img.alt,
    isPrimary: img.isPrimary,
    sortOrder: idx,
  }));

  const product = existing
    ? await prisma.product.update({
        where: { sku },
        data: {
          ...productData,
          images: {
            deleteMany: {},
            create: productImages,
          },
          inventory: {
            upsert: {
              create: { quantity: 999, lowStockAlert: 0 },
              update: { quantity: 999, lowStockAlert: 0 },
            },
          },
        },
      })
    : await prisma.product.create({
        data: {
          ...productData,
          images: {
            create: productImages,
          },
          inventory: {
            create: { quantity: 999, lowStockAlert: 0 },
          },
        },
      });

  console.log("Product successfully added/updated:", product.slug, product.id);
}

main().finally(() => prisma.$disconnect());
