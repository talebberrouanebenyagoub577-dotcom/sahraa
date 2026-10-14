const ADMIN_EMAIL = "admin@sahraa.com";
const ADMIN_PASSWORD = "Sahraa@2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function main() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("FAIL: Login request failed", res.status, data);
    process.exit(1);
  }

  const user = data.data?.user;
  if (!user?.email || user.email !== ADMIN_EMAIL) {
    console.error("FAIL: Unexpected login response", data);
    process.exit(1);
  }

  console.log("OK: Login API succeeded");
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  console.error("Make sure npm run dev is running on", BASE_URL);
  process.exit(1);
});
