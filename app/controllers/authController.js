const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { jwtSecret } = require("../../config/env");
const { ApiError } = require("../utils/errors");
const { userView } = require("../utils/serializers");

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
      throw new ApiError(400, "username and password are required");
    }
    const loginName = username.trim();
    const user =
      (await User.findOne({ username: loginName.toLowerCase() }).select("+passwordHash")) ||
      (await User.findOne({ name: loginName }).select("+passwordHash"));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(401, "Invalid username or password");
    }
    const token = jwt.sign({}, jwtSecret, { subject: String(user._id), expiresIn: "7d" });
    res.json({ success: true, user: userView(user), token });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };
