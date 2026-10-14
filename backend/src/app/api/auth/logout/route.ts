import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth/middleware";
import { apiSuccess } from "@/lib/api/response";
import { clearAuthCookie } from "@/lib/http/cookies";

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (auth) {
    await prisma.refreshToken.deleteMany({
      where: { userId: auth.user.userId },
    });
  }

  const response = apiSuccess({ message: "Logged out" });
  response.cookies.delete("access_token");
  return response;
}
