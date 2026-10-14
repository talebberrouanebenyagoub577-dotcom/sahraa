/**
 * Removes every product and related cart/wishlist lines (keeps orders/history intact).
 * Run: npx tsx scripts/clear-all-products.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const countBefore = await prisma.product.count();
  if (countBefore === 0) {
    console.log("No products in database.");
    return;
  }

  await prisma.$transaction([
    prisma.cartItem.deleteMany({}),
    prisma.wishlistItem.deleteMany({}),
    prisma.savedForLater.deleteMany({}),
    prisma.recentlyViewed.deleteMany({}),
    prisma.product.deleteMany({}),
  ]);

  const countAfter = await prisma.product.count();
  console.log(`Removed ${countBefore} product(s). Remaining: ${countAfter}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
