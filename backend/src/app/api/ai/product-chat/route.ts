import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { withRateLimit } from "@/lib/api/rate-limit";
import { answerProductQuestion } from "@/lib/ai/product-assistant";

const schema = z.object({
  slug: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(1000),
  locale: z.enum(["ar", "en"]).default("ar"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(800),
      })
    )
    .max(8)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await withRateLimit(request, "ai-product-chat");
    if (limited instanceof Response) return limited;

    const data = schema.parse(await request.json());
    const answer = await answerProductQuestion(data);
    if (!answer) {
      return apiError(
        data.locale === "en"
          ? "This product assistant is not available."
          : "مساعد هذا المنتج غير متوفر حالياً.",
        404
      );
    }

    return apiSuccess({
      response: answer.reply,
      available: answer.available,
      related: [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
