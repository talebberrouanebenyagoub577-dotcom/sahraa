import prisma from "@/lib/prisma";
import {
  detectDialect,
  groundedFallback,
  isUnknownCatalogReply,
  productAssistantSystemPrompt,
  sanitizeModelReply,
  resolveLockedProductSlug,
  uniqueProductSlugFromCatalog,
  unknownReply,
  type ProductAssistantContext,
  type ProductAssistantReply,
  type SupportDialect,
} from "./product-context";

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => (value || "").trim()).filter(Boolean))];
}

export async function loadProductAssistantContext(
  slug: string
): Promise<ProductAssistantContext | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      nameAr: true,
      description: true,
      descriptionAr: true,
      price: true,
      compareAtPrice: true,
      sku: true,
      barcode: true,
      weight: true,
      dimensions: true,
      status: true,
      codAvailable: true,
      category: { select: { name: true, nameAr: true } },
      faqs: {
        orderBy: { sortOrder: "asc" },
        select: { question: true, questionAr: true, answer: true, answerAr: true },
      },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
      variants: {
        where: { isActive: true },
        select: { name: true, nameAr: true, color: true, size: true, price: true },
      },
      inventory: { select: { quantity: true, reserved: true } },
    },
  });
  if (!product || product.status !== "APPROVED") return null;

  const stock = (product.inventory?.quantity || 0) - (product.inventory?.reserved || 0);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    category: product.category.name,
    categoryAr: product.category.nameAr,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: "SAR",
    sku: product.sku,
    barcode: product.barcode,
    weight: product.weight,
    dimensions: product.dimensions,
    codAvailable: product.codAvailable,
    inStock: stock > 0,
    colors: uniqueStrings(product.variants.map((item) => item.color)),
    sizes: uniqueStrings(product.variants.map((item) => item.size)),
    variants: product.variants.map((item) => ({
      name: item.name,
      nameAr: item.nameAr || item.name,
      color: item.color,
      size: item.size,
      price: item.price,
    })),
    images: product.images.map((item) => ({ url: item.url, alt: item.alt })),
    faqs: product.faqs.map((faq) => ({
      question: faq.question,
      questionAr: faq.questionAr || faq.question,
      answer: faq.answer,
      answerAr: faq.answerAr || faq.answer,
    })),
    related: [],
  };
}

export async function resolveSupportProductSlug(input: {
  slug?: string;
  message: string;
}): Promise<string | null> {
  const catalog = await prisma.product.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, name: true, nameAr: true, sku: true },
    take: 200,
  });
  const named = uniqueProductSlugFromCatalog(catalog, input.message);
  const locked = resolveLockedProductSlug(input.slug, named);
  if (!locked) return null;
  return catalog.some((row) => row.slug === locked) ? locked : null;
}

async function askOpenAi(
  question: string,
  pageText: string,
  locale: string
): Promise<string | null> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  const messages = [
    { role: "system" as const, content: productAssistantSystemPrompt(locale) },
    {
      role: "system" as const,
      content: `PAGE_TEXT\n${pageText.slice(0, 4000)}`,
    },
    { role: "user" as const, content: question.slice(0, 1000) },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      temperature: 0,
      max_tokens: 400,
      messages,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || null;
}

export async function answerProductQuestion(input: {
  slug: string;
  message: string;
  locale: string;
  dialect?: SupportDialect;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ProductAssistantReply | null> {
  void input.history;
  const ctx = await loadProductAssistantContext(input.slug);
  if (!ctx) return null;

  const dialect = input.dialect || detectDialect(input.message, input.locale);
  const fallback = groundedFallback(input.message, ctx, input.locale, dialect);
  if (isUnknownCatalogReply(fallback.reply, dialect)) {
    return fallback;
  }

  try {
    const generated = await askOpenAi(input.message, fallback.reply, input.locale);
    if (!generated) return fallback;
    return {
      reply: sanitizeModelReply(generated, ctx, input.message, dialect),
      available: true,
      usedOpenAi: true,
      related: [],
      showRelated: false,
    };
  } catch {
    return fallback;
  }
}

export async function answerSupportQuestion(input: {
  message: string;
  slug?: string;
  locale: string;
  country?: string;
}): Promise<ProductAssistantReply> {
  const dialect = detectDialect(input.message, input.locale, input.country);
  const slug = await resolveSupportProductSlug({
    slug: input.slug,
    message: input.message,
  });
  if (!slug) {
    return {
      reply: unknownReply(dialect),
      available: true,
      usedOpenAi: false,
      related: [],
      showRelated: false,
    };
  }
  const answer = await answerProductQuestion({
    slug,
    message: input.message,
    locale: input.locale,
    dialect,
  });
  return (
    answer || {
      reply: unknownReply(dialect),
      available: false,
      usedOpenAi: false,
      related: [],
      showRelated: false,
    }
  );
}
