const householdTimeZone = process.env.HOUSEHOLD_TIMEZONE || "Asia/Beirut";

function isDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function shiftDate(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekDates(start) {
  if (!isDateString(start)) throw new TypeError("start must be a valid YYYY-MM-DD date");
  const day = new Date(`${start}T00:00:00.000Z`).getUTCDay();
  const saturday = shiftDate(start, -((day + 1) % 7));
  return Array.from({ length: 7 }, (_, index) => shiftDate(saturday, index));
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: householdTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

module.exports = { isDateString, localDate, shiftDate, weekDates };
