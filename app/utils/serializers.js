function userView(user) {
  return {
    id: String(user._id),
    name: user.name,
    ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
  };
}

function mealView(meal) {
  return {
    id: String(meal._id),
    name: meal.name,
    categories: [...meal.categories],
    userId: String(meal.userId),
    notes: meal.notes || "",
    timesCooked: meal.timesCooked,
  };
}

function planDayView(day) {
  return {
    date: day.date,
    mealId: String(day.mealId),
    category: day.category,
    proposedBy: String(day.proposedBy),
    ...(day.status && day.status !== "pending" ? { status: day.status } : {}),
    ...(day.mealName ? { mealName: day.mealName } : {}),
    ...(day.mealCategories?.length ? { mealCategories: [...day.mealCategories] } : {}),
  };
}

module.exports = { mealView, planDayView, userView };
