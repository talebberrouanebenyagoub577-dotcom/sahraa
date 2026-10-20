import { dashboardPath, isStoreAdminRole } from "./dashboard-path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

assert(isStoreAdminRole("SUPER_ADMIN"), "super admin");
assert(isStoreAdminRole("ADMIN"), "admin");
assert(!isStoreAdminRole("CUSTOMER"), "customer");
assert(dashboardPath("ar", "SUPER_ADMIN") === "/ar/dashboard/admin", "admin path");
assert(dashboardPath("ar", "CUSTOMER") === "/ar/dashboard/customer", "customer path");
console.log("dashboard path roles ok");
