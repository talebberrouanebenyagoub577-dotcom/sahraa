import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { ADMIN_ROLES, getAuthFromRequest, requireRole } from "../auth/middleware";

const anonymous = new NextRequest("http://localhost/api/orders");
assert.equal(getAuthFromRequest(anonymous), null);
assert.equal(requireRole(null, ADMIN_ROLES), false);
assert.ok(ADMIN_ROLES.includes("ADMIN" as never));
assert.ok(ADMIN_ROLES.includes("SUPER_ADMIN" as never));

console.log("admin orders auth gates ok");
