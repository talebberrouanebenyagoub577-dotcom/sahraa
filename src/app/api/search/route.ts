import { NextRequest } from "next/server";
import { semanticSearch, getSearchSuggestions } from "@/lib/ai/search";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { withRateLimit } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request);
    if (rateLimitResult instanceof Response) return rateLimitResult;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "search";
    const categoryId = searchParams.get("categoryId") || undefined;
    const locale = (searchParams.get("locale") || "ar") as "ar" | "en";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!q || q.length < 2) {
      return apiSuccess({ results: [], suggestions: [] });
    }

    if (type === "suggest") {
      const suggestions = await getSearchSuggestions(q, limit);
      return apiSuccess({ suggestions });
    }

    const results = await semanticSearch(q, { categoryId, limit, locale });
    return apiSuccess({ results, query: q });
  } catch (error) {
    return handleApiError(error);
  }
}
