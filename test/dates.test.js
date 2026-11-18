const test = require("node:test");
const assert = require("node:assert/strict");
const { isDateString, shiftDate, weekDates } = require("../app/utils/dates");

test("validates calendar dates instead of accepting date-shaped invalid values", () => {
  assert.equal(isDateString("2026-02-28"), true);
  assert.equal(isDateString("2026-02-30"), false);
  assert.equal(isDateString("26-02-28"), false);
});

test("computes Saturday-based weeks without local timezone shifts", () => {
  assert.deepEqual(weekDates("2026-11-18"), [
    "2026-11-14",
    "2026-11-15",
    "2026-11-16",
    "2026-11-17",
    "2026-11-18",
    "2026-11-19",
    "2026-11-20",
  ]);
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
});
