import { NextResponse } from "next/server";

export function handleRoot(): Response {
  return NextResponse.json({
    success: true,
    name: "SAHRAA",
    service: "sahraaaaaaaaaaa-api",
    status: "ok",
    links: {
      health: "/health",
      apiHealth: "/api/health",
      products: "/api/products?limit=20",
      categories: "/api/categories",
      storefrontHome: "/api/storefront/home",
      productBySlug: "/api/storefront/products/{slug}",
    },
  });
}
