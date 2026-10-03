import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "oswei-disposable-toilet-cleaning-wand";
const sku = "SAHRAA-OSWEI-TOILET-WAND";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_53faeda0-9a72-4ce2-8b8f-7eda9e432ea6-d04a2a5d-e9f7-4e24-b563-eac938141421.jpg",
    filename: "product.jpg",
    alt: "محتويات مجموعة oswei: حامل أبيض، مقبض التنظيف، ووسادات إسفنجية زرقاء قابلة للاستبدال",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_f8975cff-dce0-4a7a-87b7-5688852a20fe-32c70dc6-588a-4d9b-9d32-55bbb08e3e20.jpg",
    filename: "lifestyle.jpg",
    alt: "تنظيف المرحاض بفرشاة oswei ذات الوسادة الإسفنجية في حمّام أنيق",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_aea6ba6b-cd81-440c-b521-aa63f64bf2e7-99b472f1-7a5c-411e-9446-e05bef111067.jpg",
    filename: "usage-guide.jpg",
    alt: "طريقة الاستعمال في 4 خطوات: اختيار وسادة، تركيبها، التنظيف، ثم التخلص منها بضغطة زر",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_7ce2d4a5-1066-478f-b537-84cbf530adaa-8882bf1d-027c-42b2-86f6-a0db8ebd06f2.jpg",
    filename: "before-after.jpg",
    alt: "صورة توضيحية قبل وبعد الاستعمال: من مرحاض متسخ إلى مرحاض نظيف ولامع",
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
    where: { slug: "home" },
    update: { isActive: true },
    create: {
      name: "Home & Living",
      nameAr: "المنزل والمعيشة",
      slug: "home",
      icon: "🏠",
      isActive: true,
    },
  });

  const productData = {
    sellerId: seller.id,
    categoryId: category.id,
    name: "oswei Disposable Toilet Cleaning Wand Set",
    nameAr: "فرشاة تنظيف المرحاض oswei بوسادات إسفنجية قابلة للاستبدال",
    slug,
    description:
      "A hygienic toilet cleaning system from oswei: a long white handle, disposable blue sponge pads, and an elegant white storage holder with a rose-gold rim and a window to see the remaining pads. Fit a fresh pad on the handle head, clean the toilet as usual, then press the button to release the used pad without touching it. No dirty brush left sitting in the bathroom, and a fresh pad for every clean. Dispose of used pads in the trash.",
    descriptionAr:
      "نظام تنظيف صحي للمرحاض من oswei: مقبض أبيض طويل، ووسادات إسفنجية زرقاء تُستعمل مرة واحدة، وحامل تخزين أبيض أنيق بإطار ذهبي وردي ونافذة لرؤية الوسادات المتبقية. ثبّت وسادة جديدة على رأس المقبض، نظّف المرحاض كالمعتاد، ثم اضغط الزر للتخلص من الوسادة المستعملة دون لمسها. لا فرشاة متسخة تبقى في الحمّام، ووسادة جديدة لكل تنظيف. تُرمى الوسادات المستعملة في سلة المهملات.",
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
          "Take a new pad from the holder, fit it on the handle head, clean the toilet as usual, then press the button on the handle to release the used pad into the trash.",
        answerAr:
          "خذ وسادة جديدة من الحامل، ثبّتها على رأس المقبض، نظّف المرحاض كالمعتاد، ثم اضغط الزر على المقبض لإسقاط الوسادة المستعملة في سلة المهملات.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Can I flush the used pad?",
        questionAr: "هل يمكن رمي الوسادة في المرحاض؟",
        answer:
          "No. Throw used pads in the trash to avoid blocking the pipes.",
        answerAr:
          "لا. ارمِ الوسادات المستعملة في سلة المهملات لتجنّب انسداد المجاري.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "What is included in the package?",
        questionAr: "ماذا تحتوي العلبة؟",
        answer:
          "A cleaning handle, a storage holder, and a set of blue sponge pads.",
        answerAr: "مقبض تنظيف، وحامل تخزين، ومجموعة وسادات إسفنجية زرقاء.",
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
