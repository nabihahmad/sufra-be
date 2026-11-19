const express = require("express");
const cors = require("cors");
const { port, corsOrigins } = require("./config/env");
const connectDB = require("./config/db");
const { authenticate } = require("./app/middleware/auth");
const { ApiError } = require("./app/utils/errors");

const app = express();
app.use(cors({ origin: corsOrigins, optionsSuccessStatus: 200 }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/auth", require("./app/routes/auth"));
app.use((req, res, next) => {
  const path = req.path.replace(/\/$/, "") || "/";
  const isPublicRead = req.method === "GET" && (path === "/meals" || path === "/plan/week");
  if (isPublicRead) return next();
  return authenticate(req, res, next);
});
app.use("/users", require("./app/routes/users"));
app.use("/meals", require("./app/routes/meals"));
app.use("/plan", require("./app/routes/plan"));

app.use((req, res, next) => next(new ApiError(404, "Not found")));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error instanceof ApiError
    ? error.status
    : error.name === "ValidationError" || (Number.isInteger(error.status) && error.status >= 400 && error.status < 500)
      ? error.status || 400
      : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status === 500 ? "Internal server error" : error.message });
});

async function start() {
  await connectDB();
  app.listen(port, () => console.log(`Sufra API listening on port ${port}`));
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start Sufra API:", error);
    process.exitCode = 1;
  });
}

module.exports = app;
