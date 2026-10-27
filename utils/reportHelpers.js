const { formatDate } = require('./dates');

/**
 * Build filter object for transaction reports based on query parameters
 * @param {Object} queryParams - Request query parameters
 * @returns {Object} Filter object with category, transactionType, startDate, and endDate
 */
function buildReportFilters(queryParams) {
  const { category, transactionType, startDate, endDate, timeframe } = queryParams;
  const filters = { category, transactionType };

  if (timeframe === 'all') {
    filters.startDate = null;
    filters.endDate = null;
  } else if (timeframe === 'custom' && startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  } else if (timeframe && timeframe.includes('-')) {
    const [year, month] = timeframe.split('-');
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    filters.startDate = formatDate(startOfMonth);
    filters.endDate = formatDate(endOfMonth);
  }

  return filters;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Build the Timeframe dropdown options: All Time, the last 6 months including
 * the current one (This month, Last month, then 4 named months, newest first),
 * then Custom Range.
 * A selected YYYY-MM value outside that window is kept so old links still work.
 * @param {string} [selected] - Currently selected timeframe value
 * @param {Date} [now] - Reference date
 * @returns {Array<{value: string, label: string}>} Dropdown options
 */
function buildTimeframeOptions(selected, now = new Date()) {
  const monthOption = (offset, label) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value, label: label || `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` };
  };

  const months = [monthOption(0, 'This month'), monthOption(1, 'Last month')];
  for (let offset = 2; offset <= 5; offset++) months.push(monthOption(offset));

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(selected || '') && !months.some(m => m.value === selected)) {
    const [year, month] = selected.split('-');
    months.push({ value: selected, label: `${MONTH_NAMES[month - 1]} ${year}` });
  }

  return [{ value: 'all', label: 'All Time' }, ...months, { value: 'custom', label: 'Custom Range' }];
}

module.exports = {
  buildReportFilters,
  buildTimeframeOptions
};
