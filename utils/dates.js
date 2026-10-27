/**
 * Date-only helpers
 * All 'YYYY-MM-DD' parsing and formatting goes through here so dates are
 * always handled in local time (new Date('YYYY-MM-DD') parses as UTC and
 * shifts the day in negative-offset timezones).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Format a date as 'YYYY-MM-DD' in local timezone
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a 'YYYY-MM-DD' string as a local date (midnight); other input is
 * passed to the Date constructor
 * @param {Date|string} value - Date or date string
 * @returns {Date} New Date object
 */
function parseLocalDate(value) {
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

/**
 * Copy of a date set to local midnight
 * @param {Date|string} value - Date or date string
 * @returns {Date} Midnight of that day
 */
function startOfDay(value) {
  const date = parseLocalDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Copy of a date shifted by a number of calendar days
 * @param {Date|string} value - Date or date string
 * @param {number} days - Days to add (negative to subtract)
 * @returns {Date} Shifted date
 */
function addDays(value, days) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Today as 'YYYY-MM-DD'
 * @returns {string} Local date string
 */
function todayString() {
  return formatDate(new Date());
}

/**
 * Yesterday as 'YYYY-MM-DD'
 * @returns {string} Local date string
 */
function yesterdayString() {
  return formatDate(addDays(new Date(), -1));
}

/**
 * True if the date is after today (time of day ignored)
 * @param {Date|string} value - Date or date string
 * @returns {boolean} True if in the future
 */
function isFutureDate(value) {
  return startOfDay(value) > startOfDay(new Date());
}

/**
 * Whole days from now until a date (rounded up)
 * @param {Date|string} value - Target date
 * @returns {number} Days remaining (negative if past)
 */
function daysUntil(value) {
  return Math.ceil((parseLocalDate(value) - new Date()) / MS_PER_DAY);
}

module.exports = {
  formatDate,
  parseLocalDate,
  startOfDay,
  addDays,
  todayString,
  yesterdayString,
  isFutureDate,
  daysUntil
};
