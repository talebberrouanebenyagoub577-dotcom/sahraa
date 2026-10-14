import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(
      await request.json()
    );

    await prisma.newsletter.upsert({
      where: { email },
      update: { isActive: true },
      create: { email },
    });

    return apiSuccess({ subscribed: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
