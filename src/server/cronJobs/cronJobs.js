// Imports
const CronJob = require('cron').CronJob;
import storesCronFunctions from '../cronJobs/storesCronFunctions.js';
import itemsCronFunctions from '../cronJobs/itemsCronFunctions.js';
import currencyHelpers from '../util/currencyHelpers.js';

// CRON job to send notification email to storeowner every day at 8:00 AM if there are
// novel items to that (1) need price approval or (2) need to be picked up.
// Also moves REQUESTED items to LISTED (and sets notification flags)
new CronJob(process.env.CRON_INTERVAL_STORE_NOTIFICATIONS,
  async function () {
    console.log('running cron job to move REQUESTED items to LISTED...');
    await storesCronFunctions.listRequestedItemsAndSetNotificiationFlags();
    console.log('running cron job checking if stores need to be notified...');
    await storesCronFunctions.sendItemVerificationEmailsToStores();
  },
  null, true, 'America/Los_Angeles'
);

// CRON job to send bank transfers to all stores needing payment
new CronJob(process.env.CRON_INTERVAL_BANK_TRANSFERS,
  function () {
    console.log("running cron job to send bank transfers to all stores needing payment...");
    storesCronFunctions.sendBankTransfersAndEmailsToStores();
  },
  null, true, 'America/Los_Angeles'
);

// CRON job to update currency rates
new CronJob(process.env.CRON_INTERVAL_CURRENCY,
  function () {
    console.log('running cron job to update currency rates...');
    currencyHelpers.updateCurrencyRates();
  },
  null, true, 'America/Los_Angeles'
);

// CRON job to unset stale in_current_transaction flags
new CronJob("* * * * *", 
  function () {
    itemsCronFunctions.unsetStaleInCurrentTransactionFlags();
  }, null, true, 'America/Los_Angeles'
);
