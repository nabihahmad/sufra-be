const mongoose = require("mongoose");
const Meal = require("../models/Meal");
const PlanDay = require("../models/PlanDay");
const { ApiError } = require("../utils/errors");
const { isDateString, localDate, weekDates } = require("../utils/dates");
const { generatePlan } = require("../utils/planner");
const { planDayView } = require("../utils/serializers");

function weekStart(value) {
  if (!isDateString(value)) throw new ApiError(400, "A valid start date is required");
  const dates = weekDates(value);
  if (dates[0] !== value) throw new ApiError(400, "start must be a Saturday");
  return dates;
}

function onlyDuplicateKeyErrors(error) {
  const writeErrors = Array.isArray(error.writeErrors) ? error.writeErrors : [];
  return writeErrors.length
    ? writeErrors.every((entry) => entry.code === 11000)
    : error.code === 11000;
}

async function insertPlanDays(days) {
  if (!days.length) return;
  try {
    await PlanDay.insertMany(days, { ordered: false });
  } catch (error) {
    if (!onlyDuplicateKeyErrors(error)) throw error;
  }
}

async function loadWeek(start) {
  const dates = weekStart(start);
  let days = await PlanDay.find({ date: { $in: dates } }).lean();
  const missingDates = dates.filter((date) => !days.some((day) => day.date === date));
  if (missingDates.length) {
    const [meals, users] = await Promise.all([
      Meal.find({ deletedAt: null }).lean(),
      require("../models/User").find().select("_id").lean(),
    ]);
    const generated = generatePlan(meals, users.map((user) => user._id), missingDates);
    await insertPlanDays(generated);
    days = await PlanDay.find({ date: { $in: dates } }).lean();
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function getWeek(req, res, next) {
  try {
    if (!req.query.start) throw new ApiError(400, "start is required");
    const days = await loadWeek(req.query.start);
    res.json(days.map(planDayView));
  } catch (error) {
    next(error);
  }
}

async function regenerateWeek(req, res, next) {
  try {
    const dates = weekStart(req.body?.start);
    const [meals, users, oldDays] = await Promise.all([
      Meal.find({ deletedAt: null }).lean(),
      require("../models/User").find().select("_id").lean(),
      PlanDay.find({ date: { $in: dates } }).lean(),
    ]);
    if (!meals.length) throw new ApiError(400, "At least one available dish is required to generate a plan");
    const closed = new Map(oldDays.filter((day) => day.status !== "pending").map((day) => [day.date, day]));
    const generated = generatePlan(meals, users.map((user) => user._id), dates);
    const byDate = new Map(generated.map((day) => [day.date, day]));
    const operations = dates
      .filter((date) => !closed.has(date) && byDate.has(date) && oldDays.some((day) => day.date === date))
      .map((date) => ({
        updateOne: {
          filter: { date, status: "pending" },
          update: { $set: byDate.get(date) },
        },
      }));
    if (operations.length) await PlanDay.bulkWrite(operations);
    const newDays = dates
      .filter((date) => !closed.has(date) && !oldDays.some((day) => day.date === date))
      .map((date) => byDate.get(date))
      .filter(Boolean);
    await insertPlanDays(newDays);
    const result = await PlanDay.find({ date: { $in: dates } }).lean().sort({ date: 1 });
    res.json(result.map(planDayView));
  } catch (error) {
    next(error);
  }
}

async function replaceMeal(req, res, next) {
  try {
    const date = req.params.date;
    const { mealId } = req.body || {};
    if (!isDateString(date)) throw new ApiError(400, "Invalid date");
    if (!mongoose.isValidObjectId(mealId)) throw new ApiError(400, "Invalid dish id");
    const day = await PlanDay.findOne({ date });
    if (!day) throw new ApiError(404, "Plan day not found");
    if (day.status !== "pending") throw new ApiError(409, "Closed days cannot be changed");
    if (String(day.proposedBy) !== String(req.user._id)) {
      throw new ApiError(403, "Only the administrator who proposed this day can change it");
    }
    const meal = await Meal.findOne({ _id: mealId, deletedAt: null });
    if (!meal || !meal.categories.includes(day.category)) {
      throw new ApiError(400, "Choose an available dish in the day's category");
    }
    const changed = await PlanDay.findOneAndUpdate(
      { date, status: "pending", proposedBy: req.user._id },
      {
        $set: {
          mealId: meal._id,
          proposedBy: meal.userId,
          mealName: meal.name,
          mealCategories: [...meal.categories],
        },
      },
      { new: true, runValidators: true },
    );
    if (!changed) throw new ApiError(409, "The plan day was changed concurrently");
    const days = await PlanDay.find({ date: { $in: weekDates(date) } }).lean().sort({ date: 1 });
    res.json(days.map(planDayView));
  } catch (error) {
    next(error);
  }
}

async function recordOutcome(req, res, next) {
  let session;
  try {
    session = await mongoose.startSession();
    const date = req.params.date;
    const { status } = req.body || {};
    if (!isDateString(date)) throw new ApiError(400, "Invalid date");
    if (status !== "cooked" && status !== "free") throw new ApiError(400, 'status must be "cooked" or "free"');
    if (date > localDate()) throw new ApiError(400, "Future days cannot be closed");

    await session.withTransaction(async () => {
      const day = await PlanDay.findOne({ date }).session(session);
      if (!day) throw new ApiError(404, "Plan day not found");
      if (day.status !== "pending") throw new ApiError(409, "This day is already closed");
      const meal = await Meal.findById(day.mealId).session(session);
      day.status = status;
      day.mealName = meal?.name || day.mealName;
      day.mealCategories = [...(meal?.categories || day.mealCategories || [])];
      day.closedAt = new Date();
      await day.save({ session });
      if (status === "cooked") {
        if (!meal) throw new ApiError(409, "The planned dish no longer exists");
        await Meal.updateOne({ _id: meal._id }, { $inc: { timesCooked: 1 } }, { session });
      }
    });
    const days = await PlanDay.find({ date: { $in: weekDates(date) } }).lean().sort({ date: 1 });
    res.json(days.map(planDayView));
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
}

async function getHistory(req, res, next) {
  try {
    const { from, to } = req.query;
    if (!isDateString(from) || !isDateString(to) || from > to) {
      throw new ApiError(400, "from and to must be valid dates, with from no later than to");
    }
    const days = await PlanDay.find({
      date: { $gte: from, $lte: to },
      status: { $in: ["cooked", "free"] },
    })
      .sort({ date: 1 })
      .lean();
    res.json(days.map(planDayView));
  } catch (error) {
    next(error);
  }
}

module.exports = { getHistory, getWeek, recordOutcome, regenerateWeek, replaceMeal };
