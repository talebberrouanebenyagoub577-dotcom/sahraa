import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "harvey-ross-instant-eye-lift";
const sku = "SAHRAA-HARVEY-ROSS-EYE-LIFT";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_cf4675bf-da4f-4f8c-911f-443f4934f01a-3cff3862-5579-4880-97e0-2d9c01c34de8.jpg",
    filename: "product.jpg",
    alt: "كريم Harvey Ross Instant Eye Lift لشد وترطيب محيط العين مع علبته الأصلية",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_e09ddeb8-61f3-4d7f-b2f3-8b675fdd3cab-4bf5080c-8cbd-4961-a7c7-4053d6c054ae.jpg",
    filename: "texture.jpg",
    alt: "قوام كريم Instant Eye Lift الأبيض الناعم على طرف الإصبع",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_be41b5ed-6784-4f45-b5f4-8e030773ee1d-933a1978-f6ee-415c-81ed-79f951278734.jpg",
    filename: "usage-guide.jpg",
    alt: "خطوات الاستعمال: كمية بحجم حبة البازلاء، ربّت بلطف بأطراف الأصابع، ثم دعه يجف",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_f184ff72-7e94-4004-bb9b-13eddfbd5837-d6a7c209-386a-48c9-848b-1310c672bcf0.jpg",
    filename: "before-after.jpg",
    alt: "صورة توضيحية قبل وبعد: من العين المتعبة والهالات إلى العين المشرقة والمشدودة",
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
    name: "Harvey Ross Instant Eye Lift Cream",
    nameAr: "كريم Harvey Ross لشد محيط العين الفوري",
    slug,
    description:
      "Harvey Ross Instant Eye Lift is a smooth white eye-area cream in a silver airless pump bottle. According to the package, it provides long-term water locking, moisturizes the eye area, and helps reduce the look of dark circles under the eyes, for a brighter, smoother-looking eye contour. Apply a pea-sized amount under the eye, pat gently with your fingertips, and let it dry. Cosmetic results vary from person to person. For external use only; avoid direct contact with the eyes and read the original package label before use.",
    descriptionAr:
      "كريم Harvey Ross Instant Eye Lift هو كريم أبيض ناعم القوام لمحيط العين، في عبوة فضية بمضخة عملية. حسب ما هو مكتوب على العبوة: يحبس الرطوبة لفترة طويلة، ويرطّب منطقة العين، ويساعد على تخفيف مظهر الهالات السوداء تحت العينين، لمظهر أكثر إشراقاً ونعومة. ضعي كمية بحجم حبة البازلاء تحت العين، ربّتي بلطف بأطراف الأصابع، ثم اتركيه يجف. النتائج التجميلية تختلف من شخص لآخر. للاستعمال الخارجي فقط، تجنّبي ملامسة العين مباشرة ويُرجى قراءة ملصق العبوة الأصلية قبل الاستعمال.",
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
          "On clean skin, place a pea-sized amount in small dots under the eye. Pat gently with your fingertips until spread, then let it dry before applying makeup.",
        answerAr:
          "على بشرة نظيفة، ضعي كمية بحجم حبة البازلاء على شكل نقاط صغيرة تحت العين. ربّتي بلطف بأطراف الأصابع حتى يتوزع، ثم اتركيه يجف قبل وضع المكياج.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Who is it suitable for?",
        questionAr: "لمن يناسب هذا المنتج؟",
        answer:
          "For adults who want to moisturize the eye area and reduce the look of tiredness and dark circles. Those with sensitive skin should test on a small area first.",
        answerAr:
          "للبالغين الراغبين في ترطيب محيط العين وتخفيف مظهر التعب والهالات. لأصحاب البشرة الحساسة يُنصح بتجربته على منطقة صغيرة أولاً.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "Are the results permanent?",
        questionAr: "هل النتيجة دائمة؟",
        answer:
          "No. It is a cosmetic product and its effect is temporary. Results vary from person to person and are not a medical treatment.",
        answerAr:
          "لا. هو منتج تجميلي وتأثيره مؤقت، والنتائج تختلف من شخص لآخر ولا يُعدّ علاجاً طبياً.",
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
