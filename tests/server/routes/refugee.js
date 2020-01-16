import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import sinon from 'sinon';

import typeformHelpers from '../../../src/server/util/typeformHelpers';
import matchingHelpers from '../../../src/server/util/matchingHelpers';
import sendgridHelpers from '../../../src/server/util/sendgridHelpers.js';
import itemHelpers from '../../../src/server/util/itemHelpers.js'
import s3Helpers from '../../../src/server/util/s3Helpers.js';

// /refugee/scores
const precision = 0.001 // float precision
test('get /refugee/scores: beneficiary scores add up to 1.00', async (t) => {
  const res = await request(app)
    .get('/api/refugee/scores')
    .auth(process.env.DUET_API_ADMIN_USERNAME, process.env.DUET_API_ADMIN_PASSWORD)
    .expect(200);
  const totalWeight = matchingHelpers.getTotalWeight(res.body);
  t.true(Math.abs(totalWeight - 1.00) <= precision);
});

// /refugee/match
test('get /refugee/match returns correct format', async (t) => {
  // TODO: handle case where there are less than 3 active beneficiaries
  const numAdditionalBeneficiaries = 2;
  const res = await request(app)
    .get('/api/refugee/match').query({ numAdditionalBeneficiaries })
    .expect(200);
  const { additionalBeneficiaries, matchedBeneficiary } = res.body;
  t.truthy(matchedBeneficiary.beneficiaryId, 'matched beneficiary has beneficiaryId');
  t.true(additionalBeneficiaries.every(beneficiary => beneficiary.beneficiaryId), 'every additional beneficiary has beneficiaryId');
  t.is(additionalBeneficiaries.length, numAdditionalBeneficiaries, 'correct number of additional beneficiaries');
});

// test /refugee/needs
test('get /refugee/needs: every beneficiary has beneficiaryId', async (t) => {
  const res = await request(app)
    .get('/api/refugee/needs')
    .expect(200);
  const allBeneficiaries = res.body;
  t.true(allBeneficiaries.every(beneficiary => beneficiary.beneficiaryId));
});

// /refugee/typeformV4
test('/refugee/typeformV4 processes Typeform payload', async (t) => {
  const typeformPayload = require('../../../test_fixtures/typeform/typeformFarsiV4Payload.json');
  const expectedItemInfo = require('../../../test_fixtures/typeform/typeformV4ExpectedItemInfo.json');

  const itemId = 243;
  const pickupCode = 'DUET-AX390';
  const oldPhotoUrl = typeformHelpers.getAnswerFromQuestionReference('item-photo', typeformPayload.form_response.answers, 'file');
  const newPhotoUrl = `https://duet-web-assets.s3.us-west-1.amazonaws.com/item-photos/item-${itemId}.jpg`;

  // set up stubs
  const insertItemFromTypeform = sinon.stub(typeformHelpers, 'insertItemFromTypeform').resolves(itemId);
  const sendTypeformErrorEmail = sinon.stub(sendgridHelpers, 'sendTypeformErrorEmail');
  const generatePickupCode = sinon.stub(itemHelpers, 'generatePickupCode').returns(pickupCode);
  const updateItemPickupCode = sinon.stub(typeformHelpers, 'updateItemPickupCode');
  const uploadItemImageToS3 = sinon.stub(s3Helpers, 'uploadItemImageToS3').resolves(newPhotoUrl);
  const updateItemPhotoLink = sinon.stub(typeformHelpers, 'updateItemPhotoLink');
  
  // make webhook call
  const res = await request(app)
    .post('/api/refugee/typeformV4')
    .send(typeformPayload)
    .expect(200);

  t.true(insertItemFromTypeform.calledOnceWithExactly(expectedItemInfo));
  t.true(sendTypeformErrorEmail.notCalled);
  t.true(updateItemPickupCode.calledOnceWithExactly(itemId, pickupCode));
  t.true(uploadItemImageToS3.calledOnceWithExactly(itemId, oldPhotoUrl));
  t.true(updateItemPhotoLink.calledOnceWithExactly(itemId, newPhotoUrl));

  t.true(res.ok);

  sinon.restore();
});
