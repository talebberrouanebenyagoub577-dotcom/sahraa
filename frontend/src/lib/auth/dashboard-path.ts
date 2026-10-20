export function dashboardPath(locale: string, role?: string | null): string {
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    return `/${locale}/dashboard/admin`;
  }
  if (role === "SELLER") {
    return `/${locale}/dashboard/seller`;
  }
  return `/${locale}/dashboard/customer`;
}

export function isDashboardHome(pathWithoutLocale: string): boolean {
  return pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/dashboard/";
}
