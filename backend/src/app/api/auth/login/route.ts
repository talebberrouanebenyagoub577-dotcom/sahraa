import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { setAuthCookie } from "@/lib/http/cookies";
import { withRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request);
    if (rateLimitResult instanceof Response) return rateLimitResult;

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { sellerProfile: true },
    });

    if (!user || !user.isActive) {
      return apiError("Invalid email or password", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return apiError("Invalid email or password", 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sellerProfile: user.sellerProfile,
      },
      accessToken,
      refreshToken,
    });

    setAuthCookie(response, accessToken, 15 * 60);

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
