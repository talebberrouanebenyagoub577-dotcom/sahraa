import { execSync } from "node:child_process";
import pg from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required. Set it in EasyPanel. The API will not start.");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query("SELECT pg_advisory_lock(9142026)");
  let failed = false;
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  } catch (error) {
    failed = true;
    console.error("prisma migrate deploy failed", error instanceof Error ? error.message : "");
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(9142026)");
    } catch {
      /* ending the session releases the lock */
    }
    await client.end();
  }

  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "migration failed");
  process.exit(1);
});
