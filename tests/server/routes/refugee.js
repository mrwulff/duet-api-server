import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import matchingHelpers from '../../../src/server/util/matchingHelpers';
require('dotenv').config();

const precision = 0.001 // float precision
test('beneficiary scores add up to 1.00', async (t) => {
  const res = await request(app)
    .get('/api/refugee/scores')
    .auth(process.env.DUET_API_ADMIN_USERNAME, process.env.DUET_API_ADMIN_PASSWORD);
  const totalWeight = matchingHelpers.getTotalWeight(res.body);
  t.true(Math.abs(totalWeight - 1.00) <= precision);
});
