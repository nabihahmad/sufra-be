require("dotenv").config();

const required = ["MONGO_URI", "JWT_SECRET"];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} must be configured`);
}
if (process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const initialUsers = process.env.INITIAL_USERS
  ? JSON.parse(process.env.INITIAL_USERS)
  : [];
if (!Array.isArray(initialUsers)) {
  throw new Error("INITIAL_USERS must be a JSON array");
}
const householdTimeZone = process.env.HOUSEHOLD_TIMEZONE || "Asia/Beirut";
new Intl.DateTimeFormat("en", { timeZone: householdTimeZone });
const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

module.exports = {
  port,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  householdTimeZone,
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:8080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  initialUsers,
};
