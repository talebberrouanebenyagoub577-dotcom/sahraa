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

const descriptionAr = `كريم RETINAL SHOT لشدّ البشرة وتعزيز مظهرها

امنحي بشرتك عناية مميزة مع كريم RETINAL SHOT Tightening Booster، المصمم للمساعدة في تحسين مظهر البشرة ومنحها مظهراً أكثر نعومة وإشراقاً.

تأتي تركيبته بقوام كريمي سهل التوزيع، مع عبوة أنيقة برأس دقيق تساعد على وضع المنتج بسهولة ضمن روتين العناية بالبشرة.

المميزات:
يساعد على تحسين مظهر البشرة وملمسها.
يدعم مظهراً أكثر نعومة وتماسكاً.
سهل التطبيق بفضل رأس العبوة الدقيق.
مناسب للإضافة إلى روتين العناية بالبشرة وفق تعليمات المنتج.

طريقة الاستخدام:
يُستخدم حسب التعليمات الموجودة على العبوة. إذا كان يحتوي على الريتينال، ابدئي باستخدامه تدريجياً في المساء، مع استعمال واقي الشمس خلال النهار. ضعي كمية صغيرة من الرأس الدقيق على شكل نقاط حول العين، ثم ربّتي بلطف بأطراف الأصابع من الداخل إلى الخارج، وتجنّبي الشد القوي وملامسة العين مباشرة.

تنبيه: يُنصح باختبار المنتج على منطقة صغيرة من البشرة قبل الاستخدام. قد يسبب الريتينال تهيجاً أو جفافاً، ويُفضّل تجنبه أثناء الحمل أو التخطيط للحمل. راجعي قائمة المكونات وتعليمات الشركة المصنّعة قبل الاستخدام.

المكونات الظاهرة على العبوة والصورة: Retinal 0.1٪، Panthenol 1٪، MATRIXYL 3000 3٪، الريتينال، النياسيناميد، توكوفيرول، حمض الأسكوربيك، الزانثان، والغلوكوز. القائمة الكاملة على ملصق العبوة الأصلية.

النتائج: الصور توضيح تجميلي فقط. النتائج تختلف من شخص لآخر، والتأثير التجميلي مؤقت وليس علاجاً طبياً.`;

const faqs = [
  {
    question: "What does this product do?",
    questionAr: "واش يدير هذا المنتج؟",
    answer:
      "RETINAL SHOT Tightening Booster is a cream to help improve the look of the skin and leave it looking smoother and brighter, with a creamy texture and a precision tip for the skincare routine.",
    answerAr:
      "كريم RETINAL SHOT Tightening Booster مصمم للمساعدة في تحسين مظهر البشرة ومنحها مظهراً أكثر نعومة وإشراقاً، بقوام كريمي سهل التوزيع وعبوة برأس دقيق ضمن روتين العناية بالبشرة.",
    sortOrder: 0,
  },
  {
    question: "How do I use it?",
    questionAr: "كيفاش نستعمله؟",
    answer:
      "Follow the pack instructions. If it contains retinal, start gradually in the evening and use sunscreen in the daytime. Place a small amount from the precision tip in dots around the eye, pat gently from the inner to the outer face, and avoid pulling the skin or getting product in the eyes.",
    answerAr:
      "يُستخدم حسب التعليمات الموجودة على العبوة. إذا كان يحتوي على الريتينال، ابدئي باستخدامه تدريجياً في المساء، مع استعمال واقي الشمس خلال النهار. ضعي كمية صغيرة من الرأس الدقيق على شكل نقاط حول العين، ثم ربّتي بلطف بأطراف الأصابع من الداخل إلى الخارج، وتجنّبي الشد القوي وملامسة العين مباشرة.",
    sortOrder: 1,
  },
  {
    question: "Who can use it?",
    questionAr: "شكون يقدر يستعمله؟",
    answer:
      "For adding to an adult skincare routine as on the pack. Prefer to avoid it during pregnancy or if planning pregnancy. Read the original label first.",
    answerAr:
      "مناسب للإضافة إلى روتين العناية بالبشرة وفق تعليمات المنتج. يُفضّل تجنبه أثناء الحمل أو التخطيط للحمل. راجعي تعليمات الشركة المصنّعة قبل الاستخدام.",
    sortOrder: 2,
  },
  {
    question: "What are the ingredients?",
    questionAr: "واش هي المكونات؟",
    answer:
      "Shown on the pack and image: Retinal 0.1%, Panthenol 1%, MATRIXYL 3000 3%, retinal, niacinamide, tocopherol, ascorbic acid, xanthan, and glucose. The full list is on the original label.",
    answerAr:
      "المكونات الظاهرة على العبوة والصورة: Retinal 0.1٪، Panthenol 1٪، MATRIXYL 3000 3٪، الريتينال، النياسيناميد، توكوفيرول، حمض الأسكوربيك، الزانثان، والغلوكوز. القائمة الكاملة على ملصق العبوة الأصلية.",
    sortOrder: 3,
  },
  {
    question: "When will I see results?",
    questionAr: "متى تظهر النتائج؟",
    answer:
      "The photos are a cosmetic illustration only. Results vary from person to person. Any cosmetic effect is temporary and this is not a medical treatment.",
    answerAr:
      "الصور توضيح تجميلي فقط. النتائج تختلف من شخص لآخر، والتأثير التجميلي مؤقت وليس علاجاً طبياً.",
    sortOrder: 4,
  },
  {
    question: "Is it suitable for sensitive skin?",
    questionAr: "هل يناسب البشرة الحساسة؟",
    answer:
      "A patch test on a small area is recommended before use. Retinal may cause irritation or dryness. Read the original label.",
    answerAr:
      "يُنصح باختبار المنتج على منطقة صغيرة من البشرة قبل الاستخدام. قد يسبب الريتينال تهيجاً أو جفافاً. راجعي ملصق العبوة الأصلية.",
    sortOrder: 5,
  },
];

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { nameAr: { contains: "RETINAL SHOT" } },
      ],
    },
    select: { id: true, slug: true, nameAr: true, description: true },
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

  await prisma.product.update({
    where: { id: product.id },
    data: {
      descriptionAr,
      description: product.description?.includes("طريقة الاستخدام")
        ? product.description
        : descriptionAr,
    },
  });

  await prisma.productFAQ.deleteMany({ where: { productId: product.id } });
  await prisma.productFAQ.createMany({
    data: faqs.map((faq) => ({ productId: product.id, ...faq })),
  });

  console.log(`Updated images and page facts for ${product.nameAr} (${product.slug})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "update failed");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
