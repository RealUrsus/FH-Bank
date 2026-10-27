const cron = require('node-cron');
const loanService = require('../services/loan.service');
const gicService = require('../services/gic.service');

/**
 * Run an action for each item, isolating failures, and log a summary.
 * @param {string} label - Task description for the logs
 * @param {Array} items - Items to process
 * @param {Function} action - async (item) => message string if processed, falsy if not applicable
 * @returns {Promise<number>} Number of items processed
 */
async function forEachActive(label, items, action) {
  console.log(`[Daily Task] ${label}...`);
  let processed = 0;

  for (const item of items) {
    try {
      const message = await action(item);
      if (message) {
        processed++;
        console.log(message);
      }
    } catch (error) {
      console.error(`Error (${label}) for account ${item.AccountID}:`, error);
    }
  }

  console.log(`[Daily Task] ${label}: ${processed} processed`);
  return processed;
}

/**
 * Disburse approved loans on their start date
 */
async function disburseLoanFunds() {
  const loans = await loanService.getActiveLoans();
  return forEachActive('Disbursing loan funds', loans, async ({ AccountID }) =>
    await loanService.disburseLoan(AccountID) && `Loan ${AccountID} funds disbursed to chequing account`);
}

/**
 * Process loan interest payments based on payment frequency
 */
async function processLoanInterest() {
  const loans = await loanService.getActiveLoans();
  return forEachActive('Processing loan interest payments', loans, async ({ AccountID }) =>
    await loanService.processLoanInterest(AccountID) && `Interest payment processed for loan ${AccountID}`);
}

/**
 * Check for paid off loans and update their status
 */
async function checkLoanPayoffs() {
  const loans = await loanService.getActiveLoans();
  return forEachActive('Checking loan payoffs', loans, async ({ AccountID }) =>
    await loanService.checkLoanPayoff(AccountID) && `Loan ${AccountID} marked as paid off`);
}

/**
 * Check for loan maturity, log to file, and withdraw remaining balance from checking
 */
async function checkLoanMaturity() {
  const loans = await loanService.getActiveLoans();
  return forEachActive('Checking loan maturity', loans, async ({ AccountID }) =>
    await loanService.checkLoanMaturity(AccountID) && `Loan ${AccountID} has matured - logged and final payment withdrawn`);
}

/**
 * Check for GIC maturity and process accordingly
 */
async function checkGICMaturity() {
  const gics = await gicService.getActiveGICs();
  return forEachActive('Checking GIC maturity', gics, async ({ AccountID }) =>
    await gicService.matureGIC(AccountID) && `GIC ${AccountID} has matured and funds transferred`);
}

/**
 * Run all daily tasks
 */
async function runDailyTasks() {
  console.log('='.repeat(50));
  console.log(`[Daily Task] Starting daily tasks at ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  try {
    // Disburse loan funds first (before interest processing)
    await disburseLoanFunds();

    // Process loan operations
    await processLoanInterest();
    await checkLoanPayoffs();
    await checkLoanMaturity();

    // Process GIC operations
    await checkGICMaturity();

    console.log('='.repeat(50));
    console.log('[Daily Task] All daily tasks completed successfully');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('[Daily Task] Error running daily tasks:', error);
  }
}

// Schedule daily tasks to run at midnight
cron.schedule('0 0 * * *', async () => {
  await runDailyTasks();
});

// Export for manual testing
module.exports = {
  runDailyTasks,
  disburseLoanFunds,
  processLoanInterest,
  checkLoanPayoffs,
  checkLoanMaturity,
  checkGICMaturity
};