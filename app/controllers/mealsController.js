const mongoose = require("mongoose");
const Meal = require("../models/Meal");
const { ApiError } = require("../utils/errors");
const { categories } = require("../utils/planner");
const { mealView } = require("../utils/serializers");

function validateCategories(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    new Set(value).size === value.length &&
    value.every((category) => categories.includes(category))
  );
}

async function listMeals(req, res, next) {
  try {
    const meals = await Meal.find({ deletedAt: null }).sort({ name: 1 }).lean();
    res.json(meals.map(mealView));
  } catch (error) {
    next(error);
  }
}

async function createMeal(req, res, next) {
  try {
    const { name, categories: mealCategories, notes = "", userId } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 160) {
      throw new ApiError(400, "name must be a non-empty string of at most 160 characters");
    }
    if (!validateCategories(mealCategories)) throw new ApiError(400, "categories must contain allowed categories");
    if (typeof userId !== "string" || !userId) throw new ApiError(400, "userId is required");
    if (userId !== String(req.user._id)) throw new ApiError(403, "A dish can only be created for its owner");
    if (typeof notes !== "string" || notes.length > 2000) throw new ApiError(400, "notes must be at most 2000 characters");

    const meal = await Meal.create({
      name: name.trim(),
      categories: mealCategories,
      notes,
      userId: req.user._id,
    });
    res.status(201).json(mealView(meal));
  } catch (error) {
    next(error);
  }
}

async function updateMeal(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid dish id");
    const patch = req.body || {};
    const updates = {};
    if ("name" in patch) {
      if (typeof patch.name !== "string" || !patch.name.trim() || patch.name.trim().length > 160) {
        throw new ApiError(400, "name must be a non-empty string of at most 160 characters");
      }
      updates.name = patch.name.trim();
    }
    if ("categories" in patch) {
      if (!validateCategories(patch.categories)) throw new ApiError(400, "categories must contain allowed categories");
      updates.categories = patch.categories;
    }
    if ("notes" in patch) {
      if (typeof patch.notes !== "string" || patch.notes.length > 2000) throw new ApiError(400, "notes must be at most 2000 characters");
      updates.notes = patch.notes;
    }
    if (!Object.keys(updates).length) throw new ApiError(400, "No editable fields supplied");

    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!meal) throw new ApiError(404, "Dish not found");
    res.json(mealView(meal));
  } catch (error) {
    next(error);
  }
}

async function deleteMeal(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid dish id");
    const meal = await Meal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );
    if (!meal) throw new ApiError(404, "Dish not found");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = { createMeal, deleteMeal, listMeals, updateMeal };
