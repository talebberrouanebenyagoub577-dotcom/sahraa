import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "hair-concealer-fuller-hair-look";
const sku = "SAHRAA-HAIR-CONCEALER";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_7fd6d16d-ddf2-45dd-9a37-6f3f2bcf09f3-668cf85f-6817-4b89-9195-8801bc5323ea.jpg",
    filename: "product.jpg",
    alt: "عبوة وعلبة بخاخ Hair Concealer لمظهر شعر أكثف، يدوم من 3 إلى 7 أيام ومقاوم للماء والعرق",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_4fa97fdb-5f4d-4a71-934d-e879576d3674-32bd2eed-be44-48fc-9ede-8ec2687a469b.jpg",
    filename: "lifestyle.jpg",
    alt: "بخاخ Hair Concealer مناسب للرجال والنساء لإطلالة شعر كثيف وأنيق",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_a3074d06-8fef-4902-8212-517744477179-bbc6ecb1-d145-4c01-b96c-b500c192c1a7.jpg",
    filename: "usage.jpg",
    alt: "طريقة الاستعمال: رشّ البخاخ مباشرة على مناطق الفراغات وخفة الشعر لتغطيتها",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_e42607c5-9844-4796-b15f-f2fc575a53e6-861f5a9f-a9c2-4fd6-80d2-00b210f5c9f2.jpg",
    filename: "before-after.jpg",
    alt: "صورة توضيحية قبل وبعد استعمال بخاخ Hair Concealer على خط الشعر وفرق الرأس",
    isPrimary: false,
  },
] as const;

async function main() {
  const publicDir = path.join(process.cwd(), "public", "products", slug);
  await mkdir(publicDir, { recursive: true });

  for (const img of images) {
    await copyFile(
      path.join(assetsDir, img.source),
      path.join(publicDir, img.filename)
    );
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
    name: "Hair Concealer Spray - Fuller Hair Look",
    nameAr: "بخاخ Hair Concealer لإخفاء فراغات الشعر",
    slug,
    description:
      "Hair Concealer is a cosmetic spray that instantly covers thinning areas, a wide parting, and a receding hairline for a fuller, denser hair look. Spray it directly onto the scalp and thinning spots, then style your hair as usual. According to the package, the result lasts 3 to 7 days and is waterproof and sweatproof. Suitable for men and women. This is a cosmetic concealer and does not treat hair loss or grow hair. For external use only; avoid contact with the eyes and read the original package label before use.",
    descriptionAr:
      "بخاخ Hair Concealer هو بخاخ تجميلي يغطّي فوراً مناطق خفة الشعر وفرق الرأس الواسع وتراجع خط الشعر، ليمنحك مظهر شعر أكثف وأكثر امتلاءً. يُرشّ مباشرة على فروة الرأس ومناطق الفراغات، ثم صفّف شعرك كالمعتاد. حسب ما هو مكتوب على العبوة، تدوم النتيجة من 3 إلى 7 أيام وهو مقاوم للماء والعرق. مناسب للرجال والنساء. هذا منتج تجميلي للتغطية فقط ولا يعالج تساقط الشعر ولا يُنبت الشعر. للاستعمال الخارجي فقط، تجنّب ملامسة العينين ويُرجى قراءة ملصق العبوة الأصلية قبل الاستعمال.",
    price: 199,
    sku,
    codAvailable: true,
    status: "APPROVED" as const,
    isFeatured: true,
    isNewArrival: true,
  };

  const productImages = images.map((img, idx) => ({
    url: `/products/${slug}/${img.filename}`,
    alt: img.alt,
    isPrimary: img.isPrimary,
    sortOrder: idx,
  }));

  const existing = await prisma.product.findUnique({ where: { sku } });

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
          images: { create: productImages },
          inventory: {
            create: { quantity: 999, lowStockAlert: 0 },
          },
        },
      });

  await prisma.productFAQ.deleteMany({ where: { productId: product.id } });
  await prisma.productFAQ.createMany({
    data: [
      {
        productId: product.id,
        question: "How do I use it?",
        questionAr: "كيفية استعمال المنتج؟",
        answer:
          "Start with clean, dry hair. Shake the bottle, then spray from a short distance onto the thinning areas. Let it dry for a moment, then style your hair as usual.",
        answerAr:
          "ابدأ بشعر نظيف وجاف. رجّ العبوة جيداً، ثم رشّ من مسافة قريبة على مناطق الفراغات وخفة الشعر. اتركه يجف لحظات، ثم صفّف شعرك كالمعتاد.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "How long does it last?",
        questionAr: "كم تدوم النتيجة؟",
        answer:
          "According to the package, it lasts 3 to 7 days and is waterproof and sweatproof. Shampooing removes it.",
        answerAr:
          "حسب العبوة، تدوم النتيجة من 3 إلى 7 أيام وهو مقاوم للماء والعرق، ويزول عند غسل الشعر بالشامبو.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "Does it treat hair loss?",
        questionAr: "هل يعالج تساقط الشعر؟",
        answer:
          "No. It is a cosmetic concealer that only covers thinning areas for a fuller look. It does not treat hair loss or grow new hair.",
        answerAr:
          "لا. هو منتج تجميلي يغطّي مناطق الفراغات لمظهر أكثف فقط، ولا يعالج التساقط ولا يُنبت شعراً جديداً.",
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
