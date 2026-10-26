import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slug = "slimmax-firming-serum-with-retinol-extract-mvh1ii9a";

const images = [
  {
    filename: "product.jpg",
    alt: "العلبة الخضراء والفضية لكريم RETINAL SHOT Tightening Booster مع أنبوب الرأس الدقيق وطريقة وضع نقاط صغيرة حول العين. المكتوب على العلبة: Retinal 0.1٪ وPanthenol 1٪ وMATRIXYL 3000 3٪، حجم 15 مل.",
    isPrimary: true,
  },
  {
    filename: "concerns.jpg",
    alt: "هل تزعجك هذه المظاهر؟ خطوط حول العين ظاهرة بدون مكياج، ارتخاء مظهر جلد الجفن، وانتفاخ تحت العين يعطي إطلالة متعبة.",
    isPrimary: false,
  },
  {
    filename: "effect.jpg",
    alt: "صور توضيحية لمظهر البشرة قبل الاستعمال، مع تحديد مناطق التطبيق حول الحاجب والعين والخد، ثم المظهر بعد الاستعمال. توضيح تجميلي فقط والنتائج تختلف من شخص لآخر.",
    isPrimary: false,
  },
  {
    filename: "lifestyle.jpg",
    alt: "أنبوب RETINAL SHOT في الوسط مع صور لمظهر بشرة نضرة واتجاهات الربت اللطيف على الوجه من الداخل إلى الخارج.",
    isPrimary: false,
  },
  {
    filename: "eye-results.jpg",
    alt: "صور مقارنة توضيحية لمظهر الخطوط حول العين والجفن قبل وبعد العناية التجميلية. التأثير مؤقت وليس علاجاً طبياً.",
    isPrimary: false,
  },
  {
    filename: "ingredients.jpg",
    alt: "المكونات الظاهرة في الصورة: الريتينال، النياسيناميد، توكوفيرول، حمض الأسكوربيك، الزانثان، والغلوكوز. القائمة الكاملة على ملصق العبوة الأصلية.",
    isPrimary: false,
  },
] as const;

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { nameAr: { contains: "RETINAL SHOT" } },
      ],
    },
    select: { id: true, slug: true, nameAr: true },
  });

  if (!product) {
    throw new Error("RETINAL SHOT product not found");
  }

  await prisma.productImage.deleteMany({ where: { productId: product.id } });
  await prisma.productImage.createMany({
    data: images.map((img, sortOrder) => ({
      productId: product.id,
      url: `/products/${slug}/${img.filename}`,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder,
    })),
  });

  console.log(`Updated images for ${product.nameAr} (${product.slug}) count=${images.length}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "update failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
