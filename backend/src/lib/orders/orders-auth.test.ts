import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { signAccessToken } from "../auth/jwt";
import { ADMIN_ROLES, getAuthFromRequest, requireRole } from "../auth/middleware";

const anonymous = new NextRequest("http://localhost/api/orders");
assert.equal(getAuthFromRequest(anonymous), null);
assert.equal(requireRole(null, ADMIN_ROLES), false);
assert.ok(ADMIN_ROLES.includes("ADMIN" as never));
assert.ok(ADMIN_ROLES.includes("SUPER_ADMIN" as never));

const token = signAccessToken({
  userId: "admin-user",
  email: "admin@example.com",
  role: "SUPER_ADMIN" as never,
});
const listed = new NextRequest("http://localhost/api/admin/orders?limit=50", {
  headers: { cookie: `access_token=${token}` },
});
const auth = getAuthFromRequest(listed);
assert.equal(auth?.user.userId, "admin-user");
assert.equal(requireRole(auth, ADMIN_ROLES), true);

const headerOnly = new NextRequest("http://localhost/api/orders?limit=50", {
  headers: { cookie: `other=1; access_token=${token}` },
});
assert.equal(getAuthFromRequest(headerOnly)?.user.role, "SUPER_ADMIN");

console.log("admin orders auth gates ok");
