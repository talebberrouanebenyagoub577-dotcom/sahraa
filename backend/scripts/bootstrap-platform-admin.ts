/**
 * One-shot bootstrap of the first SUPER_ADMIN and platform seller.
 * Does not run prisma seed, does not create demo users, does not print secrets.
 *
 * Required env:
 *   DATABASE_URL
 *   BOOTSTRAP_ADMIN_EMAIL
 *   BOOTSTRAP_ADMIN_PASSWORD
 *
 * Optional:
 *   BOOTSTRAP_ADMIN_FIRST_NAME
 *   BOOTSTRAP_ADMIN_LAST_NAME
 *
 * Abort conditions (checked inside a serializable transaction):
 *   - missing env
 *   - any SUPER_ADMIN already exists
 *   - email already exists
 *   - any SellerProfile already exists
 *   - platform slug sahraa-official-store already exists
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const PLATFORM_STORE_SLUG = "sahraa-official-store";
const MIN_PASSWORD_LENGTH = 12;
const DEMO_SEED_PASSWORD = "Sahraa@2026";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const email = requiredEnv("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = requiredEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const firstName = process.env.BOOTSTRAP_ADMIN_FIRST_NAME?.trim() || "Super";
  const lastName = process.env.BOOTSTRAP_ADMIN_LAST_NAME?.trim() || "Admin";

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`BOOTSTRAP_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (password === DEMO_SEED_PASSWORD) {
    throw new Error("Refusing the repository demo seed password. Choose a new unique password.");
  }

  const passwordHash = await hashPassword(password);
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existingAdmins = await tx.user.count({
          where: { role: "SUPER_ADMIN" },
        });
        if (existingAdmins > 0) {
          throw new Error("A SUPER_ADMIN already exists. Refusing to create another.");
        }

        const emailTaken = await tx.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (emailTaken) {
          throw new Error("That email is already registered. Refusing to create another user.");
        }

        const sellerCount = await tx.sellerProfile.count();
        if (sellerCount > 0) {
          throw new Error("A SellerProfile already exists. Refusing to create another store.");
        }

        const existingPlatform = await tx.sellerProfile.findUnique({
          where: { slug: PLATFORM_STORE_SLUG },
          select: { id: true },
        });
        if (existingPlatform) {
          throw new Error("sahraa-official-store already exists. Refusing to continue.");
        }

        const admin = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: "SUPER_ADMIN",
            emailVerified: true,
            isActive: true,
            cart: { create: {} },
            loyaltyPoints: { create: {} },
          },
          select: { id: true, email: true, role: true, isActive: true },
        });

        const ownedSeller = await tx.sellerProfile.findUnique({
          where: { userId: admin.id },
          select: { slug: true },
        });
        if (ownedSeller) {
          throw new Error("New admin unexpectedly already has a seller profile. Rolling back.");
        }

        const seller = await tx.sellerProfile.create({
          data: {
            userId: admin.id,
            storeName: "SAHRAA Store",
            storeNameAr: "متجر صحرا",
            slug: PLATFORM_STORE_SLUG,
            description: "Official SAHRAA catalog",
            descriptionAr: "المتجر الرسمي لمنصة صحرا",
            status: "APPROVED",
            approvedAt: new Date(),
          },
          select: { id: true, slug: true, userId: true, status: true },
        });

        const adminCount = await tx.user.count({ where: { role: "SUPER_ADMIN" } });
        const platformCount = await tx.sellerProfile.count({
          where: { slug: PLATFORM_STORE_SLUG, userId: admin.id },
        });
        if (adminCount !== 1 || platformCount !== 1) {
          throw new Error("Post-create check failed: expected exactly one SUPER_ADMIN and one platform seller.");
        }

        return { admin, seller };
      },
      { isolationLevel: "Serializable" }
    );

    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          admin: {
            id: result.admin.id,
            email: result.admin.email,
            role: result.admin.role,
            isActive: result.admin.isActive,
          },
          seller: {
            id: result.seller.id,
            slug: result.seller.slug,
            userId: result.seller.userId,
            status: result.seller.status,
          },
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  process.stderr.write(String(err instanceof Error ? err.message : err) + "\n");
  process.exit(1);
});
