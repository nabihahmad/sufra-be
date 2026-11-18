const mongoose = require("mongoose");

const categories = ["meat", "chicken", "fish", "pasta", "rice", "stew", "vegetarian"];
const planDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    mealId: { type: mongoose.Schema.Types.ObjectId, ref: "Meal", required: true },
    category: { type: String, enum: categories, required: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "cooked", "free"], default: "pending" },
    mealName: { type: String },
    mealCategories: [{ type: String, enum: categories }],
    closedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlanDay", planDaySchema);
