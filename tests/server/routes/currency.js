import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import nock from 'nock';

test('properly updates currency rates', async (t) => {
  const currencyRates = { rates: { "EUR": 3.673181 } }
  nock('https://openexchangerates.org')
    .get(`/api/latest.json?app_id=${process.env.OPEN_EXCHANGE_APP_ID}`)
    .reply(200, currencyRates);
  const res = await request(app)
    .get('/api/currency')
    .expect(200);
  
  t.deepEqual(res.body, currencyRates);
});
