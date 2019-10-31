import test from 'ava';
import sinon from 'sinon';

import storesCronFunctions from '../../../src/server/cronJobs/storesCronFunctions.js'
import storeHelpers from '../../../src/server/util/storeHelpers.js'
import itemHelpers from '../../../src/server/util/itemHelpers.js'
import sendgridHelpers from '../../../src/server/util/sendgridHelpers.js'
import transferwiseHelpers from '../../../src/server/util/transferwiseHelpers.js'

test('storeCronFunctions.listRequestedItemsAndSetNotificiationFlags() makes correct calls', async (t) => {
  // set up fixtures
  const item329 = require('../../../assets/test_fixtures/items/item329Obj.json');

  // set up stubs
  const getItemObjsWithStatus = sinon.stub(itemHelpers, 'getItemObjsWithStatus');
  getItemObjsWithStatus.withArgs('REQUESTED').resolves([item329]);
  const setSingleItemNotificationFlag = sinon.stub(itemHelpers, 'setSingleItemNotificationFlag');
  const setSingleStoreNotificationFlag = sinon.stub(storeHelpers, 'setSingleStoreNotificationFlag');
  const updateSingleItemStatus = sinon.stub(itemHelpers, "updateSingleItemStatus");

  // make cron function call
  await storesCronFunctions.listRequestedItemsAndSetNotificiationFlags();

  // check assertions
  t.true(setSingleItemNotificationFlag.calledOnceWithExactly(329));
  t.true(setSingleStoreNotificationFlag.calledOnceWithExactly(1));
  t.true(updateSingleItemStatus.calledOnceWithExactly("LISTED", 329));

  // restore stubs
  sinon.restore();
});

test('storeCronFunctions.sendBankTransfersAndEmailsToStores() makes correct calls', async (t) => {
  // set up fixtures
  const storesNeedingBankTransferResult = require('../../../assets/test_fixtures/stores/storesNeedingTransferResult.json');
  const singleStoreResult = storesNeedingBankTransferResult[0];

  // set up stubs
  const getStoresNeedingBankTransfer = sinon.stub(transferwiseHelpers, 'getStoresNeedingBankTransfer').resolves(storesNeedingBankTransferResult);
  const sendBankTransfer = sinon.stub(transferwiseHelpers, 'sendBankTransfer');
  const setBankTransferSentFlagForItemIds = sinon.stub(transferwiseHelpers, 'setBankTransferSentFlagForItemIds');
  const sendStorePaymentEmail = sinon.stub(sendgridHelpers, 'sendStorePaymentEmail');
  const sendTransferwiseEuroBalanceUpdateEmail = sinon.stub(transferwiseHelpers, 'sendTransferwiseEuroBalanceUpdateEmail');

  // make cron function call
  await storesCronFunctions.sendBankTransfersAndEmailsToStores();

  // check assertions
  t.true(getStoresNeedingBankTransfer.calledOnce);
  t.true(sendBankTransfer.calledOnceWithExactly(singleStoreResult.store_name, singleStoreResult.iban, singleStoreResult.payment_amount, "EUR")); // TODO: with args
  t.true(setBankTransferSentFlagForItemIds.calledOnceWithExactly(singleStoreResult.item_ids));
  t.true(sendStorePaymentEmail.calledOnceWithExactly({
    storeEmail: "alvanopouloufer@gmail.com",
    storeName: "Admiral",
    paymentAmountEuros: 16,
    itemIds: "#330",
    paymentMethod: "bank"
  }));
  t.true(sendTransferwiseEuroBalanceUpdateEmail.calledOnce);

  // restore stubs
  sinon.restore();
});

test('storeCronFunctions.sendItemVerificationEmailsToStores() makes correct calls', async (t) => {
  // set up fixtures
  const store1 = require('../../../assets/test_fixtures/stores/store1Obj.json');
  const item329 = require('../../../assets/test_fixtures/items/item329Obj.json');

  // set up stubs
  const getStoreObjsThatNeedNotification = sinon.stub(storeHelpers, 'getStoreObjsThatNeedNotification').resolves([store1]);
  const getItemObjsForStoreNotificationEmail = sinon.stub(storeHelpers, 'getItemObjsForStoreNotificationEmail');
  getItemObjsForStoreNotificationEmail.withArgs(store1.storeId).resolves([item329]);
  const sendStoreItemVerificationEmail = sinon.stub(sendgridHelpers, 'sendStoreItemVerificationEmail');
  const unsetItemsNotificationFlags = sinon.stub(itemHelpers, 'unsetItemsNotificationFlags');
  const unsetSingleStoreNotificationFlag = sinon.stub(storeHelpers, 'unsetSingleStoreNotificationFlag');

  // make cron function call
  await storesCronFunctions.sendItemVerificationEmailsToStores();

  // check assertions
  t.true(getStoreObjsThatNeedNotification.calledOnce);
  t.true(getItemObjsForStoreNotificationEmail.calledOnce);
  t.true(sendStoreItemVerificationEmail.calledOnceWithExactly(store1, [item329]));
  t.true(unsetItemsNotificationFlags.calledOnceWithExactly([329]));
  t.true(unsetSingleStoreNotificationFlag.calledOnceWithExactly(1));

  // restore stubs
  sinon.restore();
});
