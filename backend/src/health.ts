import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function handleHealth(): Promise<Response> {
  let database: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (error) {
    console.error("[health] database", error instanceof Error ? error.message : "unavailable");
  }

  const ok = database === "ok";
  return NextResponse.json(
    { ok, database, service: "sahraaaaaaaaaaa-api" },
    { status: ok ? 200 : 503 }
  );
}
