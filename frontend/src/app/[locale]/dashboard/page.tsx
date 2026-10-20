import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { dashboardPath } from "@/lib/auth/dashboard-path";
import { verifyAccessTokenEdge } from "@/lib/auth/edge-jwt";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const token = (await cookies()).get("access_token")?.value;
  const payload = token ? verifyAccessTokenEdge(token) : null;
  if (!payload) {
    redirect(`/${locale}/auth/login`);
  }

  redirect(dashboardPath(locale, payload.role));
}
