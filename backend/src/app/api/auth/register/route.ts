import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { setAuthCookie } from "@/lib/http/cookies";
import { withRateLimit } from "@/lib/api/rate-limit";
import { getCurrencyForCountry } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request);
    if (rateLimitResult instanceof Response) return rateLimitResult;

    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) return apiError("Email already registered", 409);

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        currency: getCurrencyForCountry(data.country),
        role: data.role === "SELLER" ? "CUSTOMER" : data.role,
        cart: { create: {} },
        loyaltyPoints: { create: {} },
      },
    });

    if (data.role === "SELLER") {
      await prisma.sellerProfile.create({
        data: {
          userId: user.id,
          storeName: `${data.firstName}'s Store`,
          storeNameAr: `متجر ${data.firstName}`,
          slug: `store-${user.id.slice(-8)}`,
          status: "PENDING",
        },
      });
    }

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
      },
      accessToken,
      refreshToken,
    }, 201);

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
