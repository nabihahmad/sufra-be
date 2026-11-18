const mongoose = require("mongoose");

const categories = ["meat", "chicken", "fish", "pasta", "rice", "stew", "vegetarian"];
const mealSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    categories: {
      type: [{ type: String, enum: categories }],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0 && new Set(value).size === value.length,
        message: "categories must contain at least one unique allowed category",
      },
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    notes: { type: String, default: "", maxlength: 2000 },
    timesCooked: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meal", mealSchema);
