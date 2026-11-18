const test = require("node:test");
const assert = require("node:assert/strict");

process.env.MONGO_URI ||= "mongodb://localhost:27017/sufra_test";
process.env.JWT_SECRET ||= "test-secret-that-is-long-enough-to-pass";

const { requireAdmin, requireSuperAdmin } = require("../app/middleware/auth");

test("regular admins do not receive super-admin permissions", () => {
  const req = { user: { isAdmin: true, isSuperAdmin: false } };
  let adminError;
  let superAdminError;

  requireAdmin(req, {}, (error) => { adminError = error; });
  requireSuperAdmin(req, {}, (error) => { superAdminError = error; });

  assert.equal(adminError, undefined);
  assert.equal(superAdminError.status, 403);
});

test("super admins can pass super-admin authorization independently", () => {
  const req = { user: { isAdmin: false, isSuperAdmin: true } };
  let error;

  requireSuperAdmin(req, {}, (nextError) => { error = nextError; });

  assert.equal(error, undefined);
});
