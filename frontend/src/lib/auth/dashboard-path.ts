export function isStoreAdminRole(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function dashboardPath(locale: string, role?: string | null): string {
  if (isStoreAdminRole(role)) {
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
