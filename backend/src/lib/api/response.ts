import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  message: string,
  status = 400,
  errors?: unknown
) {
  return NextResponse.json(
    { success: false, error: message, errors },
    { status }
  );
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation failed", 422, error.flatten().fieldErrors);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError("SKU already exists", 409);
    }
    if (error.code === "P2003") {
      return apiError("Related record not found", 400);
    }
  }
  console.error("API Error:", error);
  return apiError("Internal server error", 500);
}
