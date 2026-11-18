const express = require("express");
const controller = require("../controllers/planController");
const { requireAdmin, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();
router.get("/week", controller.getWeek);
router.post("/week/regenerate", requireSuperAdmin, controller.regenerateWeek);
router.put("/day/:date", requireAdmin, controller.replaceMeal);
router.post("/day/:date/outcome", requireSuperAdmin, controller.recordOutcome);
router.get("/history", controller.getHistory);

module.exports = router;
