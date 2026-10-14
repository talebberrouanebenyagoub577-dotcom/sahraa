import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Removing all product references…");

  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.savedForLater.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.productRelation.deleteMany();

  const { count } = await prisma.product.deleteMany();
  console.log(`Deleted ${count} product(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
