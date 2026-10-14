import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "admin@sahraa.com";
const ADMIN_PASSWORD = "Sahraa@2026";

async function main() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: {
        email: true,
        role: true,
        isActive: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      console.error(`FAIL: Admin user not found (${ADMIN_EMAIL})`);
      process.exit(1);
    }

    const passwordOk = await bcrypt.compare(ADMIN_PASSWORD, user.passwordHash);
    if (!passwordOk) {
      console.error("FAIL: Admin password does not match Sahraa@2026");
      process.exit(1);
    }

    if (!user.isActive) {
      console.error("FAIL: Admin account is inactive");
      process.exit(1);
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      console.error(`FAIL: Admin role is ${user.role}, expected SUPER_ADMIN or ADMIN`);
      process.exit(1);
    }

    console.log("OK: Default admin account verified");
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   Name:     ${user.firstName} ${user.lastName}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
