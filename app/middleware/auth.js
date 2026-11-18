const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../../config/env");
const { ApiError } = require("../utils/errors");

async function authenticate(req, res, next) {
  try {
    const authorization = req.get("authorization") || "";
    const [scheme, token] = authorization.split(" ");
    if (scheme !== "Bearer" || !token) throw new ApiError(401, "Authentication required");
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub).select("_id name avatarUrl isAdmin isSuperAdmin");
    if (!user) throw new ApiError(401, "User no longer exists");
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid or expired token"));
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return next(new ApiError(403, "Administrator permission required"));
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user?.isSuperAdmin) return next(new ApiError(403, "Super administrator permission required"));
  next();
}

module.exports = { authenticate, requireAdmin, requireSuperAdmin };
