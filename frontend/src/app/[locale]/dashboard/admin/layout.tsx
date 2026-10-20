import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiUrl } from "@/lib/api";

const STORE_ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export default async function AdminSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect(`/${locale}/auth/login`);
  }

  let role: string | undefined;
  try {
    const response = await fetch(apiUrl("/api/auth/me"), {
      headers: { cookie: `access_token=${token}` },
      cache: "no-store",
    });
    if (response.ok) {
      const body = (await response.json()) as { data?: { role?: string } };
      role = body.data?.role;
    }
  } catch {
    role = undefined;
  }

  if (!role) {
    redirect(`/${locale}/auth/login`);
  }

  if (!STORE_ADMIN_ROLES.has(role)) {
    redirect(`/${locale}/dashboard/customer`);
  }

  return children;
}
