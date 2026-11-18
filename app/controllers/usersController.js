const User = require("../models/User");
const { userView } = require("../utils/serializers");

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select("_id name avatarUrl isAdmin isSuperAdmin").sort({ name: 1 }).lean();
    res.json(users.map(userView));
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers };
