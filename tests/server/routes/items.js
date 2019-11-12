import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import sinon from 'sinon';

import sendgridHelpers from '../../../src/server/util/sendgridHelpers.js';
import fbHelpers from '../../../src/server/util/fbHelpers.js';
import itemHelpers from '../../../src/server/util/itemHelpers.js';

// /items
test('get /items: every item has itemId', async (t) => {
  const res = await request(app)
    .get('/api/items')
    .expect(200);
  const allItems = res.body;
  t.true(allItems.every(item => item.itemId));
});

// /items?store_id=[storeId]
test('get /items with storeId returns items only from that store', async (t) => {
  const storeId = 1;
  const res = await request(app)
    .get('/api/items').query({ store_id: storeId })
    .expect(200);
  t.true(res.body.every(item => item.storeId === storeId));
});

// /items/updateItemStatus
test('/items/updateItemStatus makes correct database, sendgrid calls', async (t) => {
  const updateItemStatusBody = require('../../../test_fixtures/items/updateItemStatusBody.json');
  const item143 = require('../../../test_fixtures/items/item143.json'); // READY_FOR_PICKUP --> PICKED_UP
  const item155 = require('../../../test_fixtures/items/item155.json'); // PAID --> READY_FOR_PICKUP

  const updateItemStatus = sinon.stub(itemHelpers, 'updateSingleItemStatus');
  const getItem = sinon.stub(itemHelpers, 'getItemObjFromItemId')
  const getItem143 = getItem.withArgs(143).resolves(itemHelpers.sqlRowToItemObj(item143));
  const getItem155 = getItem.withArgs(155).resolves(itemHelpers.sqlRowToItemObj(item155));
  const sendItemStatusUpdateEmail = sinon.stub(sendgridHelpers, 'sendItemStatusUpdateEmail');
  const sendPickupNotification = sinon.stub(fbHelpers, 'sendPickupNotification');
  const sendItemPickedUpEmail = sinon.stub(sendgridHelpers, 'sendItemPickedUpEmailV2');

  // make updateItemStatus call
  const res = await request(app)
    .post('/api/items/updateItemStatus')
    .send(updateItemStatusBody)
    .expect(200);

  t.true(updateItemStatus.calledTwice);
  t.true(updateItemStatus.calledWithExactly("PICKED_UP", 143));
  t.true(updateItemStatus.calledWithExactly("READY_FOR_PICKUP", 155));
  t.true(sendItemStatusUpdateEmail.calledTwice);
  t.true(sendPickupNotification.calledOnceWithExactly(155));
  t.true(sendItemPickedUpEmail.calledOnceWithExactly(143));

  t.true(res.ok);

  sinon.restore();
});
