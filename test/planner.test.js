const test = require("node:test");
const assert = require("node:assert/strict");
const { generatePlan } = require("../app/utils/planner");

test("generates seven days with category membership and preserved dish snapshots", () => {
  const meals = [
    { _id: "meal-a", name: "Rice chicken", categories: ["rice", "chicken"], userId: "user-a" },
    { _id: "meal-b", name: "Pasta", categories: ["pasta"], userId: "user-b" },
  ];
  const dates = ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

  const plan = generatePlan(meals, ["user-a", "user-b"], dates);
  assert.equal(plan.length, 7);
  assert.deepEqual(plan.map((day) => day.date), dates);
  for (const day of plan) {
    const meal = meals.find((item) => item._id === day.mealId);
    assert.ok(meal.categories.includes(day.category));
    assert.equal(day.mealName, meal.name);
    assert.deepEqual(day.mealCategories, meal.categories);
  }
});

test("returns no plan when there are no dishes", () => {
  assert.deepEqual(generatePlan([], ["user-a"], ["2026-11-14"]), []);
});
