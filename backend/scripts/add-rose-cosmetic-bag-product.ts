import { PrismaClient } from "@prisma/client";
import { loadProjectEnv } from "./load-project-env";

const dbTarget = loadProjectEnv();
const prisma = new PrismaClient();

const slug = "rose-of-no-mans-land-cosmetic-bag";
const sku = "SAHRAA-ROSE-COSMETIC-BAG";

const offerAr = "قطعة: 149 ريال · توصيل مجاني\n2 قطع: 199 ريال · توصيل مجاني";
const offerEn = "1 piece: 149 SAR · free delivery\n2 pieces: 199 SAR · free delivery";

const images = [
  {
    filename: "colors.jpg",
    alt: `صورة مرجعية لكل الألوان المتاحة: أسود، بيج، وردي، وبني.\n${offerAr}`,
    isPrimary: true,
  },
  {
    filename: "collage.jpg",
    alt: `الحقيبة البيج بالمقبض، مع الوردي والأسود من الجانب.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "brown.jpg",
    alt: `الحقيبة باللون البني، بمقبض علوي وسحّاب وكتابة ROSE OF NO MAN'S LAND.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "beige.jpg",
    alt: `الحقيبة باللون البيج الفاتح، بمقبض وسحّاب وكتابة ROSE OF NO MAN'S LAND.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "pink.jpg",
    alt: `الحقيبة باللون الوردي، بمقبض علوي وسحّاب وكتابة ROSE OF NO MAN'S LAND.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "black.jpg",
    alt: `الحقيبة باللون الأسود، بمقبض علوي وسحّاب وكتابة ROSE OF NO MAN'S LAND.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "hold.jpg",
    alt: `الحقيبة البيج محمولة من المقبض العلوي، بحجم يناسب اليد والتنقل.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "interior.jpg",
    alt: `عند فتح السحّاب تظهر بطانة بيج وجيوب داخلية لترتيب الزجاجات والفرش والأدوات.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "packing.jpg",
    alt: `فتحة واسعة تسهّل وضع العطور والفرش والأدوات داخل الجيوب دون فوضى.\n${offerAr}`,
    isPrimary: false,
  },
  {
    filename: "brown-beige.jpg",
    alt: `الحقيبة البنية والحقيبة البيج معاً، بنفس الشكل والمقبض والسحّاب.\n${offerAr}`,
    isPrimary: false,
  },
] as const;

const descriptionAr = `حقيبة تنظيم المكياج والأدوات الشخصية ROSE OF NO MAN'S LAND

حقيبة بسحّاب ومقبض علوي، وعليها كتابة ROSE OF NO MAN'S LAND. الصورة المرجعية تعرض كل الألوان المتاحة: أسود، بيج، وردي، وبني.

عند فتح السحّاب تظهر بطانة بيج وجيوب داخلية لترتيب الزجاجات والفرش والأدوات، مع فتحة واسعة تسهّل وضع الأغراض وإخراجها. تُحمل من المقبض العلوي.

السعر:
${offerAr}`;

const description = `ROSE OF NO MAN'S LAND cosmetic organizer bag

A zippered bag with a top handle and ROSE OF NO MAN'S LAND printed on the front. The reference photo shows every available color: black, beige, pink, and brown.

When unzipped, a beige lining and inner pockets appear for bottles, brushes, and tools, with a wide opening that makes packing and unpacking easy. Carry it by the top handle.

Price:
${offerEn}`;

const variants = [
  {
    name: "Brown",
    nameAr: "بني",
    sku: `${sku}-BROWN`,
    color: "بني",
    colorHex: "#C4783A",
    stock: 999,
  },
  {
    name: "Beige",
    nameAr: "بيج",
    sku: `${sku}-BEIGE`,
    color: "بيج",
    colorHex: "#E8D5C4",
    stock: 999,
  },
  {
    name: "Pink",
    nameAr: "وردي",
    sku: `${sku}-PINK`,
    color: "وردي",
    colorHex: "#E8B4B8",
    stock: 999,
  },
  {
    name: "Black",
    nameAr: "أسود",
    sku: `${sku}-BLACK`,
    color: "أسود",
    colorHex: "#1A1A1A",
    stock: 999,
  },
];

async function main() {
  console.log(
    `Catalog write target: ${dbTarget.kind} host=${dbTarget.host} db=${dbTarget.db}`
  );
  if (dbTarget.kind === "remote" && process.env.ALLOW_REMOTE_DB !== "1") {
    throw new Error(
      "Refusing a remote DATABASE_URL. This script uses the local .env (localhost) or the EasyPanel Backend service environment. Set ALLOW_REMOTE_DB=1 only after confirming the host."
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
    name: "ROSE OF NO MAN'S LAND Cosmetic Organizer Bag",
    nameAr: "حقيبة تنظيم المكياج والأدوات الشخصية ROSE OF NO MAN'S LAND",
    slug,
    description,
    descriptionAr,
    price: 149,
    compareAtPrice: 199,
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
          variants: {
            deleteMany: {},
            create: variants,
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
          variants: { create: variants },
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
        question: "What is this product?",
        questionAr: "واش هي هذه الحقيبة؟",
        answer:
          "A zippered cosmetic organizer bag with a top handle and ROSE OF NO MAN'S LAND printed on the front. Inside are pockets for bottles, brushes, and tools.",
        answerAr:
          "حقيبة تنظيم للمكياج والأدوات الشخصية بسحّاب ومقبض علوي، وعليها كتابة ROSE OF NO MAN'S LAND. من الداخل جيوب لترتيب الزجاجات والفرش والأدوات.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "What colors are available?",
        questionAr: "واش هي الألوان المتوفرة؟",
        answer:
          "The reference photo shows four colors: black, beige, pink, and brown.",
        answerAr:
          "الصورة المرجعية تعرض أربعة ألوان: أسود، بيج، وردي، وبني.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "How do I use it?",
        questionAr: "كيفاش نستعملها؟",
        answer:
          "Unzip the wide opening, place bottles, brushes, and tools in the inner pockets, then carry the bag by the top handle.",
        answerAr:
          "افتحي السحّاب ذا الفتحة الواسعة، ضعي الزجاجات والفرش والأدوات في الجيوب الداخلية، ثم احملي الحقيبة من المقبض العلوي.",
        sortOrder: 2,
      },
      {
        productId: product.id,
        question: "What is the price?",
        questionAr: "واش هو السعر؟",
        answer: offerEn.replace(/\n/g, " "),
        answerAr: offerAr.replace(/\n/g, " "),
        sortOrder: 3,
      },
    ],
  });

  console.log(`Published product: ${product.nameAr} (${product.slug})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "publish failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
