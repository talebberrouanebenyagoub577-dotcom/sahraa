import {
  UNKNOWN_MAGHREB,
  UNKNOWN_SAUDI,
  detectDialect,
  formatProductContext,
  groundedFallback,
  resolveLockedProductSlug,
  sanitizeModelReply,
  uniqueProductSlugFromCatalog,
  unknownReply,
  type ProductAssistantContext,
} from "./product-context";
import { extractProductSlug } from "./product-slug";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const concealer: ProductAssistantContext = {
  id: "p1",
  slug: "hair-concealer",
  name: "Hair Concealer",
  nameAr: "بخاخ إخفاء فراغات الشعر",
  description: "Cosmetic spray that covers thinning areas.",
  descriptionAr: "بخاخ تجميلي يغطّي مناطق خفة الشعر.",
  category: "Beauty",
  categoryAr: "جمال",
  price: 199,
  compareAtPrice: 249,
  currency: "SAR",
  sku: "SAHRAA-HAIR-CONCEALER",
  barcode: null,
  weight: null,
  dimensions: null,
  codAvailable: true,
  inStock: true,
  colors: ["أسود"],
  sizes: [],
  variants: [{ name: "Black", nameAr: "أسود", color: "أسود", size: null, price: null }],
  images: [{ url: "/uploads/concealer.jpg", alt: "Hair concealer bottle" }],
  faqs: [
    {
      question: "How do I use it?",
      questionAr: "كيفية استعمال المنتج؟",
      answer: "Start with clean, dry hair. Shake, then spray on thinning areas.",
      answerAr: "ابدأ بشعر نظيف وجاف. رجّ العبوة ثم رشّ على مناطق الفراغات.",
    },
    {
      question: "Does it treat hair loss?",
      questionAr: "هل يعالج تساقط الشعر؟",
      answer: "No. It is a cosmetic concealer and does not treat hair loss.",
      answerAr: "لا. هو منتج تجميلي ولا يعالج التساقط ولا يُنبت شعراً جديداً.",
    },
    {
      question: "Who is it suitable for?",
      questionAr: "لمن يناسب هذا المنتج؟",
      answer: "Adults who want to cover thinning areas. Sensitive skin: patch test first.",
      answerAr: "للبالغين الذين يريدون تغطية الفراغات. للبشرة الحساسة جرب على منطقة صغيرة أولاً.",
    },
  ],
  related: [],
};

const usage = groundedFallback("كيفاش نستعمله؟", concealer, "ar");
assert(usage.reply.includes("رجّ العبوة"), "usage comes from the product page FAQ");
assert(!usage.usedOpenAi, "fallback does not call OpenAI");

const treat = groundedFallback("هل يعالج تساقط الشعر؟", concealer, "ar");
assert(treat.reply.includes("لا يعالج"), "treatment answer stays on the page FAQ");

const invented = groundedFallback("واش هي المكونات؟ فيه retinol؟", concealer, "ar");
assert(invented.reply === UNKNOWN_MAGHREB, "does not invent ingredients missing from the page");

const medical = groundedFallback("هل يعالج مرض الصدفية؟", concealer, "ar", "maghreb");
assert(medical.reply === UNKNOWN_MAGHREB, "medical benefits not on the page are refused");

assert(
  extractProductSlug(undefined, "https://sahraaaaaaaaaaa.shop/ar/products/al-asmad-alharmain-kohl") ===
    "al-asmad-alharmain-kohl",
  "product slug can be read from the page URL"
);

const named = groundedFallback("اسم المنتج", concealer, "ar");
assert(named.reply.includes("بخاخ إخفاء فراغات الشعر"), "product name comes from the page");

const priced = groundedFallback("سعر المنتج", concealer, "ar");
assert(priced.reply.includes("199"), "product price comes from the page");
assert(priced.reply.includes("SAR"), "price uses the store currency");
assert(priced.reply.includes("249"), "displayed compare-at price comes from the page");

const color = groundedFallback("واش لون المنتج؟", concealer, "ar");
assert(color.reply.includes("أسود"), "colors come from page variants");

const missingSize = groundedFallback("واش المقاسات؟", concealer, "ar");
assert(missingSize.reply === UNKNOWN_MAGHREB, "missing sizes are not guessed");

const what = groundedFallback("ما هو هذا المنتج؟", concealer, "ar");
assert(what.reply.includes("بخاخ تجميلي"), "what-is uses the page description");
assert(what.reply.includes("رجّ العبوة"), "what-is can include page FAQ facts");
assert(!what.reply.includes("retinol"), "what-is does not add ingredients outside the page");

const shipping = groundedFallback("كم مدة التوصيل؟", concealer, "ar", "maghreb");
assert(shipping.reply === UNKNOWN_MAGHREB, "shipping times not on the page are refused");

const saudiShipping = groundedFallback("كم يوم يوصل؟", concealer, "ar", "saudi");
assert(saudiShipping.reply === UNKNOWN_SAUDI, "Saudi customers get the Saudi refusal");

const payment = groundedFallback("أقدر أدفع بفيزا؟", concealer, "ar", "saudi");
assert(payment.reply === UNKNOWN_SAUDI, "card payment is refused unless shown on the page");

const returns = groundedFallback("واش سياسة الإرجاع؟", concealer, "ar");
assert(returns.reply === UNKNOWN_MAGHREB, "returns policy is refused unless on the page");

const compare = groundedFallback("ما الفرق بينه وبين المنتجات الأخرى؟", concealer, "ar");
assert(compare.reply === UNKNOWN_MAGHREB, "other products are not mixed into the answer");
assert(!compare.showRelated, "related products are not attached");

const cod = groundedFallback("واش كاين الدفع عند الاستلام؟", concealer, "ar");
assert(cod.reply.includes("الدفع عند الاستلام"), "COD is answered only because it is on the page");

const card = formatProductContext(concealer, "ar");
assert(card.includes("SAHRAA-HAIR-CONCEALER"), "context includes the real SKU");
assert(card.includes("199 SAR"), "context includes the store price only");
assert(!card.includes("RELATED"), "context does not include other products");
assert(!card.includes("خصم سري"), "context does not invent discounts");

const emptyFaqs = groundedFallback("متى تظهر النتائج؟", { ...concealer, faqs: [] }, "ar");
assert(emptyFaqs.reply === UNKNOWN_MAGHREB, "missing facts are stated clearly");

const retinal: ProductAssistantContext = {
  ...concealer,
  slug: "slimmax-firming-serum-with-retinol-extract-mvh1ii9a",
  name: "Slimmax Firming Serum with Retinol Extract",
  nameAr: "كريم RETINAL SHOT لشدّ البشرة وتعزيز مظهرها",
  description:
    "Use as directed on the pack. If it contains retinal, start gradually in the evening and use sunscreen in the daytime.",
  descriptionAr:
    "يُستخدم حسب التعليمات الموجودة على العبوة. إذا كان يحتوي على الريتينال، ابدئي باستخدامه تدريجياً في المساء، مع استعمال واقي الشمس خلال النهار. يُنصح باختبار المنتج على منطقة صغيرة من البشرة قبل الاستخدام. قد يسبب الريتينال تهيجاً أو جفافاً، ويُفضّل تجنبه أثناء الحمل. النتائج التجميلية تختلف من شخص لآخر وليست علاجاً طبياً.",
  colors: [],
  sizes: [],
  variants: [],
  faqs: [],
  images: [
    {
      url: "/products/slimmax-firming-serum-with-retinol-extract-mvh1ii9a/ingredients.jpg",
      alt: "المكونات الظاهرة في الصورة: الريتينال، النياسيناميد، توكوفيرول، حمض الأسكوربيك، الزانثان، والغلوكوز.",
    },
  ],
};

const retinalUsage = groundedFallback("كيفاش نستعمله؟", retinal, "ar");
assert(retinalUsage.reply.includes("تدريجياً في المساء"), "usage comes from the product page text");

const retinalIngredients = groundedFallback("واش هي المكونات؟", retinal, "ar");
assert(retinalIngredients.reply.includes("الريتينال"), "ingredients come from the page images");
assert(retinalIngredients.reply.includes("النياسيناميد"), "only ingredients shown on the page");

const retinalWho = groundedFallback("شكون يقدر يستعمله؟", retinal, "ar");
assert(retinalWho.reply.includes("اختبار المنتج"), "who-can-use comes from the page warning");

const retinalSensitive = groundedFallback("هل يناسب البشرة الحساسة؟", retinal, "ar");
assert(retinalSensitive.reply.includes("منطقة صغيرة"), "sensitive-skin answer stays on the page");

const retinalResults = groundedFallback("متى تظهر النتائج؟", retinal, "ar");
assert(retinalResults.reply.includes("تختلف من شخص لآخر"), "results timing is not invented");
assert(!/\d+\s*(يوم|أيام|أسبوع)/.test(retinalResults.reply), "no invented result timeline");

assert(detectDialect("وش سعره لو سمحت", "ar") === "saudi", "Saudi dialect is detected");
assert(
  unknownReply("en") ===
    "Sorry, that information is not on this product page. I can only help with the details shown here.",
  "English missing-page reply"
);

const catalog = [
  { slug: "hair-concealer", name: "Hair Concealer", nameAr: "بخاخ إخفاء فراغات الشعر", sku: "SAHRAA-HAIR-CONCEALER" },
  { slug: "kohl", name: "Al Asmad Kohl", nameAr: "الكحل الأسود", sku: "SAHRAA-AL-ASMAD-KOHL" },
];
assert(
  uniqueProductSlugFromCatalog(catalog, "بكم بخاخ إخفاء فراغات الشعر") === "hair-concealer",
  "a named product resolves to that page only"
);
assert(
  uniqueProductSlugFromCatalog(catalog, "سعر بخاخ إخفاء فراغات الشعر والكحل الأسود") === null,
  "two named products are not mixed"
);
assert(
  resolveLockedProductSlug("hair-concealer", "kohl") === null,
  "a question about another product does not use this page's facts"
);
assert(resolveLockedProductSlug("hair-concealer", null) === "hair-concealer", "the open product page stays locked");

const leaked = sanitizeModelReply(
  "التوصيل مع أرامكس خلال 2-5 أيام ويمكن الدفع عبر PayPal.",
  concealer,
  "كم مدة التوصيل؟",
  "maghreb"
);
assert(leaked === UNKNOWN_MAGHREB, "model output cannot invent shipping or payment");

console.log("product-assistant tests passed");
