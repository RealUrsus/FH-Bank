/**
 * Formatting utility functions
 */

/**
 * Format currency value
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

module.exports = {
  formatCurrency
};
