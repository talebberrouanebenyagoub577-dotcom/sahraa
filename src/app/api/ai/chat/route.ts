import { NextRequest } from "next/server";
import { chatAssistant } from "@/lib/ai/generator";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { withRateLimit } from "@/lib/api/rate-limit";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  orderId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, "ai-chat");
    if (rateLimitResult instanceof Response) return rateLimitResult;

    const body = await request.json();
    const { message, orderId } = chatSchema.parse(body);
    const auth = getAuthFromRequest(request);

    const response = await chatAssistant(message, {
      userId: auth?.user.userId,
      orderId,
    });

    return apiSuccess({ response });
  } catch (error) {
    return handleApiError(error);
  }
}
