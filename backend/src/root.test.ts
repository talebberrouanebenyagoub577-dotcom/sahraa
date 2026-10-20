import { handleRoot } from "./root";

async function main() {
  const response = await handleRoot();
  if (response.status !== 200) {
    throw new Error(`expected 200, got ${response.status}`);
  }
  const body = (await response.json()) as {
    success: boolean;
    name: string;
    service: string;
    status: string;
    links: Record<string, string>;
  };
  if (body.success !== true) throw new Error("success");
  if (body.name !== "SAHRAA") throw new Error("name");
  if (body.service !== "sahraaaaaaaaaaa-api") throw new Error("service");
  if (body.status !== "ok") throw new Error("status");
  if (body.links.products !== "/api/products?limit=20") throw new Error("products link");
  if (body.links.categories !== "/api/categories") throw new Error("categories link");
  if (body.links.health !== "/health") throw new Error("health link");
  if (body.links.apiHealth !== "/api/health") throw new Error("apiHealth link");
  if (body.links.storefrontHome !== "/api/storefront/home") throw new Error("storefrontHome link");
  console.log("root handler ok");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
