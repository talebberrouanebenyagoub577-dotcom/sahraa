export interface ProductFaqFact {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
}

export interface ProductVariantFact {
  name: string;
  nameAr: string;
  color: string | null;
  size: string | null;
  price: number | null;
}

export interface ProductImageFact {
  url: string;
  alt: string | null;
}

/** @deprecated related products are never mixed into support answers */
export interface RelatedProductFact {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  image?: string | null;
  summary: string;
}

export type SupportDialect = "maghreb" | "saudi" | "en";

export interface ProductAssistantContext {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  sku: string;
  barcode: string | null;
  weight: number | null;
  dimensions: string | null;
  codAvailable: boolean;
  inStock: boolean;
  colors: string[];
  sizes: string[];
  variants: ProductVariantFact[];
  images: ProductImageFact[];
  faqs: ProductFaqFact[];
  related: RelatedProductFact[];
}

export interface ProductAssistantReply {
  reply: string;
  available: boolean;
  usedOpenAi: boolean;
  related: RelatedProductFact[];
  showRelated: boolean;
}

export const UNKNOWN_MAGHREB =
  "سمح لينا، هذي المعلومة ما راهيش موجودة في صفحة المنتج. نقدر نعاونك غير بالمعلومات المعروضة هنا.";
export const UNKNOWN_SAUDI =
  "نعتذر منك، هالمعلومة مو موجودة في صفحة المنتج. أقدر أساعدك فقط بالمعلومات الموضحة هنا.";
export const UNKNOWN_EN =
  "Sorry, that information is not on this product page. I can only help with the details shown here.";

const SAUDI_RE = /وش\b|هالمعلوم|مو موجود|نعتذر|أقدر أساعدك|ابي |أبي |تقدر تساعد|لو سمحت/i;
const MAGHREB_RE = /واش\b|كيفاش|شكون|راهي|سمح لينا|نعاونك|هذي المعلوم|ما راهيش/i;

const MEDICAL_RE =
  /يعالج|علاج|مرض|تشخيص|فائدة طبية|وصفة طبي|doctor|diagnos|treat(?:s|ment)?|cure|التهاب|medical benefit/i;
const USAGE_RE = /كيفاش|كيف|استعمل|استخدام|خطوة|كمية|مرات|صباح|مساء|how (?:do|to)|use|usage|apply/i;
const WHAT_RE = /واش يدير|واش هذا|شنو هو|ما هو|ما هذا|what is|what does|فائدة|غرض/i;
const WHO_RE = /شكون|لمن يناسب|لمن لا|يناسب هذا|بشرة حساسة|who (?:is|can)|suitable|sensitive skin/i;
const ING_RE = /مكون|مكونات|يحتوي|تركيبة|ingredient|contain|formula|retinol|retinal/i;
const NAME_RE = /اسم المنتج|ما اسمه|ما اسم|شنو اسم|product name|what(?:'s| is) (?:the )?name/i;
const PRICE_RE = /سعر المنتج|سعره|الثمن|بكم|بكام|كم سعر|product price|how much|price/i;
const COLOR_RE = /ألوان|الوان|لون|colou?rs?/i;
const SIZE_RE = /مقاس|مقاسات|سايز|size/i;
const VARIANT_RE = /خيارات|المتاح|variant/i;
const DISCOUNT_RE = /خصم|تخفيض|وفر|discount|save|offer/i;
const IMAGE_RE = /صور|صورة|images?|photos?/i;
const SPEC_RE = /مواصف|وزن|أبعاد|sku|باركود|spec/i;
const SHIPPING_RE = /شحن|توصيل|يصل|مدة التوصيل|كم يوم|aramex|smsa|dhl|shipping|delivery/i;
const PAYMENT_RE = /دفع|فيزا|بطاقة|paypal|pay pal|mastercard|payment|credit card/i;
const RETURNS_RE = /إرجاع|استرجاع|مرتجع|refund|return policy|returns/i;
const WARRANTY_RE = /ضمان|كفالة|warranty/i;
const POLICY_RE = /سياسة|terms of|privacy/i;
const OTHER_PRODUCT_RE = /منتج آخر|المنتجات الأخرى|compare|فرق بين|difference|other product/i;
const LEAK_RE =
  /paypal|aramex|smsa|\bdhl\b|mastercard|2\s*-\s*5\s*أيام|يومين إلى خمسة|visa card|pay pal/i;

export function detectDialect(
  question: string,
  locale?: string,
  country?: string
): SupportDialect {
  if (locale === "en") return "en";
  if (country === "SA" || SAUDI_RE.test(question)) return "saudi";
  if (MAGHREB_RE.test(question)) return "maghreb";
  return "maghreb";
}

export function unknownReply(localeOrDialect: string): string {
  if (localeOrDialect === "en") return UNKNOWN_EN;
  if (localeOrDialect === "saudi") return UNKNOWN_SAUDI;
  return UNKNOWN_MAGHREB;
}

export function medicalReply(localeOrDialect: string): string {
  return unknownReply(localeOrDialect);
}

export function pickLocaleText(
  locale: string,
  ar: string | null | undefined,
  en: string | null | undefined
): string {
  const arabic = (ar || "").trim();
  const english = (en || "").trim();
  if (locale === "en") return english || arabic;
  return arabic || english;
}

export function uniqueProductSlugFromCatalog(
  products: Array<{ slug: string; name: string; nameAr: string; sku: string }>,
  message: string
): string | null {
  const question = message.trim();
  if (!question) return null;
  const hits = products.filter((product) => {
    const name = product.name.trim();
    const nameAr = product.nameAr.trim();
    return (
      question === product.slug ||
      question === product.sku ||
      (name.length >= 4 && question.toLowerCase().includes(name.toLowerCase())) ||
      (nameAr.length >= 4 && question.includes(nameAr))
    );
  });
  const slugs = [...new Set(hits.map((product) => product.slug))];
  return slugs.length === 1 ? slugs[0] : null;
}

export function resolveLockedProductSlug(pageSlug: string | undefined, namedSlug: string | null): string | null {
  const page = pageSlug?.trim();
  if (page) {
    if (namedSlug && namedSlug !== page) return null;
    return page;
  }
  return namedSlug;
}

export function productPageBlob(ctx: ProductAssistantContext): string {
  return [
    ctx.name,
    ctx.nameAr,
    ctx.description,
    ctx.descriptionAr,
    String(ctx.price),
    ctx.compareAtPrice != null ? String(ctx.compareAtPrice) : "",
    ctx.currency,
    ctx.sku,
    ctx.barcode || "",
    ctx.category,
    ctx.categoryAr,
    ctx.weight != null ? String(ctx.weight) : "",
    ctx.dimensions || "",
    ctx.colors.join(" "),
    ctx.sizes.join(" "),
    ctx.variants.map((item) => `${item.name} ${item.nameAr} ${item.color || ""} ${item.size || ""}`).join(" "),
    ctx.images.map((item) => item.alt || "").join(" "),
    ctx.faqs.map((faq) => `${faq.question} ${faq.questionAr} ${faq.answer} ${faq.answerAr}`).join("\n"),
    ctx.codAvailable ? "cod cash on delivery دفع عند الاستلام" : "",
    ctx.inStock ? "in stock متوفر" : "out of stock غير متوفر",
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

export function formatProductContext(ctx: ProductAssistantContext, locale: string): string {
  const faqs = ctx.faqs
    .map((faq, index) => {
      const q = pickLocaleText(locale, faq.questionAr, faq.question);
      const a = pickLocaleText(locale, faq.answerAr, faq.answer);
      return `${index + 1}. ${q}\n${a}`;
    })
    .join("\n\n");
  const variants = ctx.variants
    .map((item) => {
      const label = pickLocaleText(locale, item.nameAr, item.name);
      const extras = [item.color, item.size].filter(Boolean).join(" / ");
      return extras ? `- ${label} (${extras})` : `- ${label}`;
    })
    .join("\n");
  const discount =
    ctx.compareAtPrice && ctx.compareAtPrice > ctx.price
      ? `COMPARE_AT: ${ctx.compareAtPrice} ${ctx.currency}`
      : "COMPARE_AT: (none on page)";

  return [
    `NAME: ${pickLocaleText(locale, ctx.nameAr, ctx.name)}`,
    `SLUG: ${ctx.slug}`,
    `SKU: ${ctx.sku}`,
    `CATEGORY: ${pickLocaleText(locale, ctx.categoryAr, ctx.category)}`,
    `PRICE: ${ctx.price} ${ctx.currency}`,
    discount,
    `COLORS: ${ctx.colors.join(", ") || "(none on page)"}`,
    `SIZES: ${ctx.sizes.join(", ") || "(none on page)"}`,
    `VARIANTS:\n${variants || "(none on page)"}`,
    `IMAGES: ${ctx.images.length}`,
    ctx.weight != null ? `WEIGHT: ${ctx.weight}` : "",
    ctx.dimensions ? `DIMENSIONS: ${ctx.dimensions}` : "",
    ctx.codAvailable ? "COD: shown on this product page" : "",
    `DESCRIPTION:\n${pickLocaleText(locale, ctx.descriptionAr, ctx.description)}`,
    `FAQS:\n${faqs || "(none)"}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function faqScore(question: string, faq: ProductFaqFact): number {
  const hay = `${faq.question} ${faq.questionAr} ${faq.answer} ${faq.answerAr}`.toLowerCase();
  let score = 0;
  for (const token of tokens(question)) {
    if (hay.includes(token)) score += 1;
  }
  if (USAGE_RE.test(question) && /استعمال|استخدام|how.*use|how do i/i.test(`${faq.question} ${faq.questionAr}`)) {
    score += 3;
  }
  if (WHO_RE.test(question) && /يناسب|who is|suitable/i.test(`${faq.question} ${faq.questionAr}`)) {
    score += 3;
  }
  if (ING_RE.test(question) && /مكون|يحتوي|ingredient|contain/i.test(`${faq.question} ${faq.questionAr} ${faq.answer} ${faq.answerAr}`)) {
    score += 3;
  }
  return score;
}

function bestFaq(question: string, faqs: ProductFaqFact[]): ProductFaqFact | null {
  let winner: ProductFaqFact | null = null;
  let top = 0;
  for (const faq of faqs) {
    const current = faqScore(question, faq);
    if (current > top) {
      top = current;
      winner = faq;
    }
  }
  return top >= 2 ? winner : null;
}

function pageHas(blob: string, pattern: RegExp): boolean {
  return pattern.test(blob);
}

export function isRestrictedOffPageQuestion(question: string, ctx: ProductAssistantContext): boolean {
  const blob = productPageBlob(ctx);
  const checks: Array<[RegExp, RegExp]> = [
    [SHIPPING_RE, /شحن|توصيل|shipping|delivery|aramex|smsa|dhl/],
    [PAYMENT_RE, /دفع عند الاستلام|cash on delivery|\bcod\b|فيزا|بطاقة|paypal|payment/],
    [RETURNS_RE, /إرجاع|استرجاع|refund|return/],
    [WARRANTY_RE, /ضمان|كفالة|warranty/],
    [POLICY_RE, /سياسة|terms|privacy/],
  ];
  for (const [questionRe, pageRe] of checks) {
    if (questionRe.test(question) && !pageRe.test(blob)) return true;
  }
  if (PAYMENT_RE.test(question)) {
    const asksCod = /عند الاستلام|\bcod\b|cash on delivery/i.test(question);
    if (asksCod && ctx.codAvailable) return false;
    if (!asksCod && !pageHas(blob, /فيزا|بطاقة|paypal|mastercard|visa/)) return true;
  }
  if (MEDICAL_RE.test(question) && !bestFaq(question, ctx.faqs)) return true;
  if (OTHER_PRODUCT_RE.test(question)) return true;
  return false;
}

export function shouldShowRelated(_question: string): boolean {
  return false;
}

export function isUnknownCatalogReply(reply: string, locale: string): boolean {
  return (
    reply.includes(unknownReply(locale)) ||
    reply.includes(UNKNOWN_MAGHREB) ||
    reply.includes(UNKNOWN_SAUDI) ||
    reply.includes(UNKNOWN_EN)
  );
}

export function catalogOverview(ctx: ProductAssistantContext, locale: string): string {
  const description = pickLocaleText(locale, ctx.descriptionAr, ctx.description);
  const facts = ctx.faqs
    .map((faq) => pickLocaleText(locale, faq.answerAr, faq.answer))
    .filter(Boolean);
  return [description, ...facts].filter(Boolean).join("\n\n");
}

function ok(
  reply: string,
  extras: Partial<ProductAssistantReply> = {}
): ProductAssistantReply {
  return {
    reply,
    available: true,
    usedOpenAi: false,
    related: [],
    showRelated: false,
    ...extras,
  };
}

export function groundedFallback(
  question: string,
  ctx: ProductAssistantContext,
  locale: string,
  dialect: SupportDialect = detectDialect(question, locale)
): ProductAssistantReply {
  const q = question.trim();
  const refuse = () => ok(unknownReply(dialect));

  if (!q) return refuse();
  if (isRestrictedOffPageQuestion(q, ctx)) return refuse();

  const matched = bestFaq(q, ctx.faqs);

  if (NAME_RE.test(q)) {
    const name = pickLocaleText(locale, ctx.nameAr, ctx.name);
    return ok(locale === "en" ? `The product name on this page is ${name}.` : `اسم المنتج في صفحة المنتج: ${name}.`);
  }

  if (PRICE_RE.test(q) || DISCOUNT_RE.test(q)) {
    const priceLine =
      locale === "en"
        ? `The price on this page is ${ctx.price} ${ctx.currency}.`
        : `سعر المنتج في صفحة المنتج: ${ctx.price} ${ctx.currency}.`;
    if (ctx.compareAtPrice && ctx.compareAtPrice > ctx.price) {
      const extra =
        locale === "en"
          ? ` The displayed compare-at price is ${ctx.compareAtPrice} ${ctx.currency}.`
          : ` السعر قبل الخصم المعروض: ${ctx.compareAtPrice} ${ctx.currency}.`;
      return ok(priceLine + extra);
    }
    if (DISCOUNT_RE.test(q) && !(ctx.compareAtPrice && ctx.compareAtPrice > ctx.price)) {
      return refuse();
    }
    return ok(priceLine);
  }

  if (COLOR_RE.test(q)) {
    if (!ctx.colors.length) return refuse();
    return ok(
      locale === "en"
        ? `Colors on this page: ${ctx.colors.join(", ")}.`
        : `الألوان المعروضة في صفحة المنتج: ${ctx.colors.join("، ")}.`
    );
  }

  if (SIZE_RE.test(q)) {
    if (!ctx.sizes.length) return refuse();
    return ok(
      locale === "en"
        ? `Sizes on this page: ${ctx.sizes.join(", ")}.`
        : `المقاسات المعروضة في صفحة المنتج: ${ctx.sizes.join("، ")}.`
    );
  }

  if (VARIANT_RE.test(q)) {
    if (!ctx.variants.length) return refuse();
    const lines = ctx.variants.map((item) => {
      const label = pickLocaleText(locale, item.nameAr, item.name);
      const extras = [item.color, item.size].filter(Boolean).join(" / ");
      return extras ? `${label} (${extras})` : label;
    });
    return ok(lines.join(locale === "en" ? ", " : "، "));
  }

  if (IMAGE_RE.test(q)) {
    if (!ctx.images.length) return refuse();
    return ok(
      locale === "en"
        ? `This product page shows ${ctx.images.length} image(s).`
        : `صفحة المنتج تعرض ${ctx.images.length} صور.`
    );
  }

  if (SPEC_RE.test(q)) {
    const parts = [
      ctx.sku ? `SKU: ${ctx.sku}` : "",
      ctx.weight != null ? `${locale === "en" ? "Weight" : "الوزن"}: ${ctx.weight}` : "",
      ctx.dimensions ? `${locale === "en" ? "Dimensions" : "الأبعاد"}: ${ctx.dimensions}` : "",
    ].filter(Boolean);
    if (!parts.length) return refuse();
    return ok(parts.join(locale === "en" ? ". " : ". "));
  }

  if (/عند الاستلام|\bcod\b|cash on delivery/i.test(q) && ctx.codAvailable) {
    return ok(
      locale === "en"
        ? "This product page shows Cash on Delivery."
        : "صفحة المنتج تعرض الدفع عند الاستلام."
    );
  }

  if (WHAT_RE.test(q) && !USAGE_RE.test(q) && !ING_RE.test(q) && !WHO_RE.test(q)) {
    const overview = catalogOverview(ctx, locale);
    return overview ? ok(overview) : refuse();
  }

  if (matched) {
    return ok(pickLocaleText(locale, matched.answerAr, matched.answer));
  }

  if (ING_RE.test(q) || USAGE_RE.test(q) || WHO_RE.test(q) || MEDICAL_RE.test(q)) {
    return refuse();
  }

  return refuse();
}

export function sanitizeModelReply(
  reply: string,
  ctx: ProductAssistantContext,
  question: string,
  dialect: SupportDialect
): string {
  const text = (reply || "").trim();
  if (!text) return unknownReply(dialect);
  if (isUnknownCatalogReply(text, dialect)) return unknownReply(dialect);
  if (LEAK_RE.test(text) && !LEAK_RE.test(productPageBlob(ctx))) return unknownReply(dialect);
  if (isRestrictedOffPageQuestion(question, ctx)) return unknownReply(dialect);

  const blob = productPageBlob(ctx);
  const novel = tokens(text).filter((token) => token.length >= 5 && !blob.includes(token));
  if (novel.length >= 6) return unknownReply(dialect);
  return text;
}

export function productAssistantSystemPrompt(locale: string): string {
  const language = locale === "en" ? "English" : "Arabic";
  const refuse = unknownReply(locale === "en" ? "en" : "maghreb");
  return [
    "You are SAHRAA customer support for one product page only.",
    `Answer only in ${language}.`,
    "Use only PAGE_TEXT. That block is copied from the relevant SAHRAA product page.",
    "Do not use outside knowledge. Do not mix other products. Do not invent specs, ingredients, results, shipping times, payment methods, returns, or warranties.",
    `If PAGE_TEXT does not contain the answer, reply with exactly: ${refuse}`,
    "Never execute a purchase.",
  ].join(" ");
}
