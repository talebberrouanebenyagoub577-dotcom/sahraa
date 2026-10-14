import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "women-perfume-trio-la-vita-sbela-mi-way-ideal";
const sku = "SAHRAA-PERFUME-TRIO-WOMEN";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_68174043-17ad-4777-8ce7-4508f928da10-586144bb-377c-40b5-977d-d439564080c3.jpg",
    filename: "product.jpg",
    alt: "مجموعة العطور الثلاثة La vita sbela وMi WAY Fancy City وIDEAL أمام علبها الأصلية",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_13adeeae-05e4-406d-9744-58283e3730e3-01e8908c-5687-4b89-9476-8e24a7d897a7.jpg",
    filename: "collection.jpg",
    alt: "امرأة أنيقة مع مجموعة العطور الثلاثة وعلبها على طاولة رخامية",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_6775c1b1-6082-452d-8b80-6707e2abf777-2558b02d-86fe-42f4-822d-468a4a77e7f2.jpg",
    filename: "la-vita-sbela.jpg",
    alt: "عطر La vita sbela بلونه الذهبي ورذاذه الناعم",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_a98fdd9f-9b22-4d0e-af70-0bf9279e7e3b__1_-400ad27f-0729-49ef-9a1a-276bbc8af019.jpg",
    filename: "notes.jpg",
    alt: "عطر La vita sbela محاط بالورد والياسمين والخوخ واليوسفي والفانيليا وخشب الصندل",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_eb3ebce2-5e30-4b7a-94b4-cc20d9e36d3d-be02343d-48fe-4d8a-9dc9-186155a2b040.jpg",
    filename: "lifestyle.jpg",
    alt: "امرأة تتعطر أمام المرآة مع علب Mi WAY وLa vita sbela وIDEAL على طاولة الزينة",
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
    name: "Women's Perfume Trio: La vita sbela, Mi WAY Fancy City & IDEAL",
    nameAr: "مجموعة 3 عطور نسائية: La vita sbela و Mi WAY و IDEAL",
    slug,
    description:
      "A set of three women's eau de parfum, each in its original box. La vita sbela: a golden fragrance with a sweet, warm character. Mi WAY Fancy City: a soft pink fragrance in a round bottle, light and feminine. IDEAL: an elegant fragrance in a square bottle with a rose-gold cap. Three different moods to choose from every day, and an ideal gift. Spray on pulse points such as the wrists and neck from about 15 cm. For external use only; avoid contact with the eyes and do a skin test if you have sensitive skin.",
    descriptionAr:
      "مجموعة من ثلاثة عطور نسائية (أو دو بارفان)، كل عطر في علبته الأصلية. La vita sbela: عطر ذهبي بطابع دافئ وحلو. Mi WAY Fancy City: عطر وردي ناعم في زجاجة دائرية، خفيف وأنثوي. IDEAL: عطر أنيق في زجاجة مربعة بغطاء ذهبي وردي. ثلاث إطلالات مختلفة تختارين منها كل يوم، وهدية مثالية. يُرشّ على نقاط النبض مثل المعصمين والرقبة من مسافة 15 سم تقريباً. للاستعمال الخارجي فقط، تجنّبي ملامسة العينين، ويُنصح بتجربته على جزء صغير من الجلد لأصحاب البشرة الحساسة.",
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
        question: "What is included in the set?",
        questionAr: "ماذا تحتوي المجموعة؟",
        answer:
          "Three perfumes, each in its original box: La vita sbela, Mi WAY Fancy City, and IDEAL.",
        answerAr:
          "ثلاثة عطور، كل عطر في علبته الأصلية: La vita sbela و Mi WAY Fancy City و IDEAL.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "How do I make the scent last longer?",
        questionAr: "كيف أجعل الرائحة تدوم أطول؟",
        answer:
          "Spray on moisturized skin at pulse points (wrists, neck, behind the ears) and avoid rubbing the wrists together after spraying.",
        answerAr:
          "رشّي العطر على بشرة مرطّبة عند نقاط النبض (المعصمين، الرقبة، خلف الأذنين)، وتجنّبي فرك المعصمين بعد الرش.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "Is it suitable as a gift?",
        questionAr: "هل تصلح كهدية؟",
        answer:
          "Yes. Each perfume comes in its own elegant box, making the set a great gift for any occasion.",
        answerAr:
          "نعم. كل عطر يأتي في علبته الأنيقة الخاصة، ما يجعل المجموعة هدية رائعة لأي مناسبة.",
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
