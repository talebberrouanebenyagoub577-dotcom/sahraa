import prisma from "@/lib/prisma";
import { levenshtein } from "@/lib/utils";
import { cacheGet, cacheSet } from "@/lib/redis";

interface SearchResult {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  price: number;
  image: string | null;
  category: string;
  score: number;
}

export async function semanticSearch(
  query: string,
  options: {
    categoryId?: string;
    limit?: number;
    locale?: "ar" | "en";
  } = {}
): Promise<SearchResult[]> {
  const { categoryId, limit = 20, locale = "ar" } = options;
  const cacheKey = `search:${query}:${categoryId || "all"}:${limit}`;
  const cached = await cacheGet<SearchResult[]>(cacheKey);
  if (cached) return cached;

  const normalizedQuery = query.trim().toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/);

  const products = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      ...(categoryId ? { categoryId } : {}),
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nameAr: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { seoKeywords: { hasSome: queryWords } },
        { sku: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, nameAr: true } },
    },
    take: limit * 2,
  });

  const scored = products.map((product) => {
    const nameField = locale === "ar" ? product.nameAr : product.name;
    const nameLower = nameField.toLowerCase();
    let score = 0;

    if (nameLower.includes(normalizedQuery)) score += 100;
    if (nameLower.startsWith(normalizedQuery)) score += 50;

    queryWords.forEach((word) => {
      if (nameLower.includes(word)) score += 20;
      if (product.seoKeywords.some((k) => k.toLowerCase().includes(word)))
        score += 15;
    });

    const distance = levenshtein(normalizedQuery, nameLower.slice(0, 30));
    score += Math.max(0, 30 - distance);

    score += product.soldCount * 0.01 + product.rating * 5;

    return {
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      slug: product.slug,
      price: product.price,
      image: product.images[0]?.url || null,
      category:
        locale === "ar" ? product.category.nameAr : product.category.name,
      score,
    };
  });

  const results = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (results.length === 0 && normalizedQuery.length > 2) {
    const fuzzyResults = await fuzzySearch(normalizedQuery, categoryId, limit);
    await cacheSet(cacheKey, fuzzyResults, 120);
    return fuzzyResults;
  }

  await cacheSet(cacheKey, results, 120);
  return results;
}

async function fuzzySearch(
  query: string,
  categoryId?: string,
  limit = 10
): Promise<SearchResult[]> {
  const allProducts = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      category: { select: { name: true, nameAr: true } },
    },
    take: 200,
    orderBy: { soldCount: "desc" },
  });

  return allProducts
    .map((product) => {
      const distance = Math.min(
        levenshtein(query, product.name.toLowerCase()),
        levenshtein(query, product.nameAr.toLowerCase())
      );
      return {
        id: product.id,
        name: product.name,
        nameAr: product.nameAr,
        slug: product.slug,
        price: product.price,
        image: product.images[0]?.url || null,
        category: product.category.nameAr,
        score: Math.max(0, 50 - distance * 5),
      };
    })
    .filter((r) => r.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function getSearchSuggestions(
  query: string,
  limit = 8
): Promise<string[]> {
  if (query.length < 2) return [];

  const cacheKey = `suggest:${query}`;
  const cached = await cacheGet<string[]>(cacheKey);
  if (cached) return cached;

  const products = await prisma.product.findMany({
    where: {
      status: "APPROVED",
      OR: [
        { name: { startsWith: query, mode: "insensitive" } },
        { nameAr: { startsWith: query, mode: "insensitive" } },
      ],
    },
    select: { name: true, nameAr: true },
    take: limit,
  });

  const suggestions = [
    ...new Set(products.flatMap((p) => [p.name, p.nameAr])),
  ].slice(0, limit);

  await cacheSet(cacheKey, suggestions, 300);
  return suggestions;
}
