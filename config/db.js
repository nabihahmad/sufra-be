const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { mongoUri, initialUsers } = require("./env");
const User = require("../app/models/User");

async function connectDB() {
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  for (const entry of initialUsers) {
    const { username, password, name, avatarUrl, isAdmin, isSuperAdmin } = entry;
    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      throw new Error("Each INITIAL_USERS entry needs username, name and a password of at least 8 characters");
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (await User.exists({ username: normalizedUsername })) continue;
    await User.create({
      username: normalizedUsername,
      passwordHash: await bcrypt.hash(password, 12),
      name: name.trim(),
      ...(typeof avatarUrl === "string" ? { avatarUrl } : {}),
      isAdmin: Boolean(isAdmin),
      isSuperAdmin: Boolean(isSuperAdmin),
    });
  }
}

module.exports = connectDB;
