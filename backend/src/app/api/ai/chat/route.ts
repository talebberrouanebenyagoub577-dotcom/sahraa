import { NextRequest } from "next/server";
import { answerSupportQuestion } from "@/lib/ai/product-assistant";
import { extractProductSlug } from "@/lib/ai/product-slug";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { withRateLimit } from "@/lib/api/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  orderId: z.string().optional(),
  slug: z.string().trim().min(1).max(160).optional(),
  locale: z.enum(["ar", "en"]).optional(),
  country: z.string().trim().min(2).max(2).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai-chat");
    if (rateLimitResult instanceof Response) return rateLimitResult;

    const body = await request.json();
    const { message, slug, locale, country } = chatSchema.parse(body);
    const productSlug = extractProductSlug(
      slug,
      request.headers.get("referer") || request.headers.get("referrer")
    );

    const answer = await answerSupportQuestion({
      message,
      slug: productSlug,
      locale: locale || "ar",
      country,
    });

    return apiSuccess({
      response: answer.reply,
      related: [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
