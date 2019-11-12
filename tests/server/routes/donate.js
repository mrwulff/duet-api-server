import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import sinon from 'sinon';

import donationHelpers from '../../../src/server/util/donationHelpers.js';
import sendgridHelpers from '../../../src/server/util/sendgridHelpers.js';
import paypalHelpers from '../../../src/server/util/paypalHelpers.js';
import itemHelpers from '../../../src/server/util/itemHelpers.js';

test('/donate/paid route processes donation correctly', async (t) => {
  const donationInfo = require('../../../src/assets/test_fixtures/donate/paidPayload.json');
  const donationId = 15;
  const item143 = require('../../../src/assets/test_fixtures/items/item143.json');
  const item155 = require('../../../src/assets/test_fixtures/items/item155.json');
  const payoutInfo = require('../../../src/assets/test_fixtures/donate/payoutInfo.json');

  const insertDonationIntoDB = sinon.stub(donationHelpers, 'insertDonationIntoDB').resolves(donationId);
  const markItemAsDonated = sinon.stub(donationHelpers, 'markItemAsDonated');
  const getItem = sinon.stub(itemHelpers, 'getItemObjFromItemId');
  const getItem143 = getItem.withArgs(143).resolves(itemHelpers.sqlRowToItemObj(item143));
  const getItem155 = getItem.withArgs(155).resolves(itemHelpers.sqlRowToItemObj(item155));
  const sendItemStatusUpdateEmail = sinon.stub(sendgridHelpers, 'sendItemStatusUpdateEmail');
  const getPayPalPayoutInfo = sinon.stub(paypalHelpers, 'getPayPalPayoutInfoForItemIds').resolves(payoutInfo);
  const sendPayout = sinon.stub(paypalHelpers, 'sendPayout');
  const sendStorePaymentEmail = sinon.stub(sendgridHelpers, 'sendStorePaymentEmail');
  const sendBalanceUpdateEmail = sinon.stub(sendgridHelpers, 'sendBalanceUpdateEmail');
  const sendDonorThankYouEmail = sinon.stub(sendgridHelpers, 'sendDonorThankYouEmailV2');

  const res = await request(app)
    .post('/api/donate/paid')
    .send(donationInfo)
    .expect(200);

  // database updates
  t.true(insertDonationIntoDB.calledOnceWithExactly(donationInfo));
  t.is(markItemAsDonated.callCount, donationInfo.itemIds.length);
  donationInfo.itemIds.forEach(itemId => t.true(markItemAsDonated.calledWith(itemId)));
  // Item status update emails
  t.true(sendItemStatusUpdateEmail.calledTwice);
  t.true(sendItemStatusUpdateEmail.calledWith(itemHelpers.sqlRowToItemObj(item143)));
  t.true(sendItemStatusUpdateEmail.calledWith(itemHelpers.sqlRowToItemObj(item155)));
  // send 1 payout to apostolos konsolakis
  t.true(getPayPalPayoutInfo.calledOnce);
  t.true(sendPayout.calledOnceWithExactly(
    payoutInfo[0].paypal,
    payoutInfo[0].payment_amount.toFixed(2),
    "EUR",
    payoutInfo[0].item_ids
  ));
  // store payment email called with correct args
  t.true(sendStorePaymentEmail.calledOnceWithExactly({
    storeEmail: payoutInfo[0].store_email,
    storeName: payoutInfo[0].store_name,
    paymentAmountEuros: payoutInfo[0].payment_amount.toFixed(2),
    paymentMethod: 'PayPal',
    itemIds: "#155",
  }));
  // donor thank you email called with correct donationId
  t.true(sendDonorThankYouEmail.calledOnceWithExactly(donationId));

  t.true(res.ok);

  sinon.restore();
});