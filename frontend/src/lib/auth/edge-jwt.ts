import type { UserRole } from "@/lib/enums";

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function verifyAccessTokenEdge(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );

    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
