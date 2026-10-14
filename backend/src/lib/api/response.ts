import { NextResponse } from "next/server";
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
  console.error("API Error:", error);
  return apiError("Internal server error", 500);
}
