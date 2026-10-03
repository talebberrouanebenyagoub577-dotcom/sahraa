import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sourceImage =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets\\c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_Sans_titre__2_-b0018aec-d924-4e46-9c2f-99abedbb44e1.jpg";
const imageFilename = "al-jabrut-assaoudi-50ml.jpg";
const imageUrl = `/uploads/products/${imageFilename}`;
const sku = "SAHRAA-JABRUT-50ML";

async function main() {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });
  await copyFile(sourceImage, path.join(uploadDir, imageFilename));

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
    name: "Al Jabrut Assaoudi 50ml",
    nameAr: "الجبروت السعودي 50 مل",
    slug: "al-jabrut-assaoudi-50ml",
    description:
      "Al Jabrut Assaoudi comes in a practical 50 ml size and distinctive premium packaging. The compact bottle is easy to keep and carry, making it suitable for personal use or gifting. Please read the original package label and ingredients before use.",
    descriptionAr:
      "الجبروت السعودي بحجم عملي 50 مل وتغليف فاخر ومميز. العبوة المدمجة سهلة الحفظ والحمل، ما يجعلها مناسبة للاستعمال الشخصي أو كهدية. يُرجى قراءة ملصق العبوة الأصلية والمكونات قبل الاستعمال.",
    price: 149,
    compareAtPrice: 199,
    sku,
    codAvailable: true,
    status: "APPROVED" as const,
    isFeatured: true,
    isNewArrival: true,
  };

  const existing = await prisma.product.findUnique({ where: { sku } });

  const product = existing
    ? await prisma.product.update({
        where: { sku },
        data: {
          ...productData,
          images: {
            deleteMany: {},
            create: {
              url: imageUrl,
              alt: "الجبروت السعودي 50 مل",
              isPrimary: true,
              sortOrder: 0,
            },
          },
          inventory: {
            upsert: {
              create: { quantity: 20, lowStockAlert: 5 },
              update: { quantity: 20, lowStockAlert: 5 },
            },
          },
        },
      })
    : await prisma.product.create({
        data: {
          ...productData,
          images: {
            create: {
              url: imageUrl,
              alt: "الجبروت السعودي 50 مل",
              isPrimary: true,
              sortOrder: 0,
            },
          },
          inventory: {
            create: { quantity: 20, lowStockAlert: 5 },
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
          "Use only as directed on the original package. Read the ingredients and instructions before first use, do not exceed the stated amount, and stop using it if irritation or discomfort occurs. Keep out of reach of children.",
        answerAr:
          "يُستعمل حصراً حسب التعليمات المكتوبة على العبوة الأصلية. اقرأ المكونات والإرشادات قبل أول استعمال، ولا تتجاوز الكمية المحددة، وتوقف عن الاستعمال عند ظهور تهيج أو انزعاج. يُحفظ بعيداً عن متناول الأطفال.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Who is this product suitable for?",
        questionAr: "لمن يناسب هذا المنتج؟",
        answer:
          "For adults looking for the original 50 ml Al Jabrut Assaoudi product. People with allergies, sensitive skin, chronic conditions, or those using medication should check the ingredients and consult a qualified professional when appropriate.",
        answerAr:
          "مخصص للبالغين الباحثين عن منتج الجبروت السعودي الأصلي بحجم 50 مل. على من لديهم حساسية أو بشرة حساسة أو حالة صحية مزمنة أو يستعملون أدوية التحقق من المكونات واستشارة مختص مؤهل عند الحاجة.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "What is included in the package?",
        questionAr: "ماذا تحتوي العلبة؟",
        answer:
          "One 50 ml Al Jabrut Assaoudi product in its retail packaging.",
        answerAr:
          "عبوة واحدة من الجبروت السعودي بحجم 50 مل داخل تغليفها التجاري.",
        sortOrder: 2,
      },
    ],
  });

  console.log(`Published product: ${product.nameAr} (${product.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
