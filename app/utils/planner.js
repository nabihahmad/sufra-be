const categories = ["meat", "chicken", "fish", "pasta", "rice", "stew", "vegetarian"];

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function generatePlan(meals, userIds, dates) {
  const availableCategories = categories.filter((category) =>
    meals.some((meal) => meal.categories.includes(category)),
  );
  if (!availableCategories.length || !userIds.length) return [];

  const users = shuffle(userIds);
  const usedMealIds = new Set();
  let queue = [];
  return dates.map((date, index) => {
    if (!queue.length) queue = shuffle(availableCategories);
    const preferredUser = users[index % users.length];
    let categoryIndex = queue.findIndex((category) =>
      meals.some(
        (meal) =>
          meal.categories.includes(category) &&
          String(meal.userId) === String(preferredUser) &&
          !usedMealIds.has(String(meal._id)),
      ),
    );
    if (categoryIndex < 0) categoryIndex = 0;
    const category = queue.splice(categoryIndex, 1)[0];
    const eligible = meals.filter((meal) => meal.categories.includes(category));
    const unused = eligible.filter((meal) => !usedMealIds.has(String(meal._id)));
    const preferred = (unused.length ? unused : eligible).filter(
      (meal) => String(meal.userId) === String(preferredUser),
    );
    const pool = preferred.length ? preferred : unused.length ? unused : eligible;
    const meal = pool[Math.floor(Math.random() * pool.length)];
    usedMealIds.add(String(meal._id));
    return {
      date,
      mealId: meal._id,
      category,
      proposedBy: meal.userId,
      status: "pending",
      mealName: meal.name,
      mealCategories: [...meal.categories],
    };
  });
}

module.exports = { categories, generatePlan };
