import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_07e726fb-1637-4427-9aeb-f111b5e7d7a4-6f8d2f1b-0fb6-4a68-a617-d4f12f38d587.jpg",
    filename: "product.jpg",
    alt: "كريم كابسيكوم لتخفيف آلام الركبة والرقبة والكتف",
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_a61dd66b-de09-491f-becd-ec3420042740-6ac8531a-d6c2-4f7d-bc15-6d6ae993794b.jpg",
    filename: "usage-guide.jpg",
    alt: "طريقة الاستعمال: تنظيف وتجفيف، دهن طبقة رقيقة، تدليك بلطف، ثم غسل اليدين",
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_2e6f1616-af91-4e85-9369-d57e6993ecac-42ebc6a2-772e-4b2c-80e0-3858f852a0e2.jpg",
    filename: "before-after.jpg",
    alt: "صورة توضيحية قبل وبعد استعمال كريم كابسيكوم",
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_40fdef1a-9c52-48da-9378-db41d148c6c3-65b0a4ba-a0fa-4af2-b8d1-b6aa0437469f.jpg",
    filename: "target-areas.jpg",
    alt: "مناطق الاستعمال: آلام الظهر والركبة والرقبة والكتف",
  },
] as const;

const sku = "SAHRAA-CAPSICUM-CREAM";
const slug = "capsicum-pain-relief-cream";

async function main() {
  const publicDir = path.join(
    process.cwd(),
    "public",
    "products",
    slug
  );
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(publicDir, { recursive: true });
  await mkdir(uploadDir, { recursive: true });

  for (const image of images) {
    const from = path.join(assetsDir, image.source);
    await copyFile(from, path.join(publicDir, image.filename));
    await copyFile(
      from,
      path.join(uploadDir, `capsicum-${image.filename}`)
    );
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
    name: "Capsicum Pain Relief Cream",
    nameAr: "كريم كابسيكوم لتخفيف الآلام",
    slug,
    description:
      "A warming capsicum cream for external use on areas of muscle and joint discomfort such as the back, knees, neck, and shoulders. Apply a thin layer to clean, dry skin, massage gently, then wash your hands well. For external use only. Avoid contact with the eyes. Read the original package label and ingredients before use.",
    descriptionAr:
      "كريم كابسيكوم دافئ للاستعمال الخارجي على مناطق آلام العضلات والمفاصل مثل الظهر والركبة والرقبة والكتف. ادهن طبقة رقيقة على بشرة نظيفة وجافة، دلّك بلطف، ثم اغسل يديك جيداً. للاستعمال الخارجي فقط. تجنّب ملامسة العينين. يُرجى قراءة ملصق العبوة الأصلية والمكونات قبل الاستعمال.",
    price: 89,
    compareAtPrice: 129,
    sku,
    codAvailable: true,
    status: "APPROVED" as const,
    isFeatured: true,
    isNewArrival: true,
  };

  const galleryImages = images.map((image, index) => ({
    url: `/uploads/products/capsicum-${image.filename}`,
    alt: image.alt,
    isPrimary: index === 0,
    sortOrder: index,
  }));

  const existing = await prisma.product.findUnique({ where: { sku } });

  const product = existing
    ? await prisma.product.update({
        where: { sku },
        data: {
          ...productData,
          images: {
            deleteMany: {},
            create: galleryImages,
          },
          inventory: {
            upsert: {
              create: { quantity: 25, lowStockAlert: 5 },
              update: { quantity: 25, lowStockAlert: 5 },
            },
          },
        },
      })
    : await prisma.product.create({
        data: {
          ...productData,
          images: { create: galleryImages },
          inventory: {
            create: { quantity: 25, lowStockAlert: 5 },
          },
        },
      });

  await prisma.productFAQ.deleteMany({ where: { productId: product.id } });
  await prisma.productFAQ.createMany({
    data: [
      {
        productId: product.id,
        question: "How should I use this product?",
        questionAr: "كيفية استعمال المنتج؟",
        answer:
          "Cleanse and dry the area, apply a thin layer, then massage gently. Wash your hands well afterwards. For external use only, and keep the cream away from the eyes. The warming feeling may last about 6 to 12 hours. Follow the original package directions and stop use if irritation occurs.",
        answerAr:
          "نظّف المنطقة وجفّفها، ثم ادهن طبقة رقيقة ودلّك بلطف. اغسل يديك جيداً بعد الاستعمال. للاستعمال الخارجي فقط، وتجنّب وصول الكريم إلى العينين. قد يستمر الإحساس بالدفء من 6 إلى 12 ساعة. اتبع تعليمات العبوة الأصلية وتوقف عن الاستعمال عند حدوث تهيّج.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Who is this product suitable for?",
        questionAr: "لمن يناسب هذا المنتج؟",
        answer:
          "For adults looking for a topical capsicum cream for areas such as the back, knees, neck, and shoulders. People with allergies, sensitive skin, chronic conditions, or those using medication should check the ingredients and consult a qualified professional when appropriate. Keep out of reach of children.",
        answerAr:
          "مخصص للبالغين الباحثين عن كريم كابسيكوم موضعي لمناطق مثل الظهر والركبة والرقبة والكتف. على من لديهم حساسية أو بشرة حساسة أو حالة صحية مزمنة أو يستعملون أدوية التحقق من المكونات واستشارة مختص مؤهل عند الحاجة. يُحفظ بعيداً عن متناول الأطفال.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "What is included in the package?",
        questionAr: "ماذا تحتوي العلبة؟",
        answer:
          "One jar of capsicum pain relief cream in its retail box. Check the original package for the exact size, ingredients, and directions.",
        answerAr:
          "علبة واحدة من كريم كابسيكوم لتخفيف الآلام داخل تغليفها التجاري. راجع العبوة الأصلية لمعرفة الحجم الدقيق والمكونات وتعليمات الاستعمال.",
        sortOrder: 2,
      },
    ],
  });

  console.log(`Published product: ${product.nameAr} (${product.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
