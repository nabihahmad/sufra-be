const express = require("express");
const controller = require("../controllers/mealsController");

const router = express.Router();
router.get("/", controller.listMeals);
router.post("/", controller.createMeal);
router.put("/:id", controller.updateMeal);
router.delete("/:id", controller.deleteMeal);

module.exports = router;
