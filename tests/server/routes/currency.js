import test from 'ava';
import app from '../../../src/server/app';
import request from 'supertest';
import nock from 'nock';

test('properly updates currency rates', async (t) => {
  const currencyRates = { rates: { "EUR": 3.673181 } }
  nock('https://openexchangerates.org')
    .get('/api/latest.json?app_id=7f0785f2b1bc4741b374c04b20d229a6')
    .reply(200, currencyRates);
  const res = await request(app)
    .get('/api/currency')
    .expect(200);
  
  t.deepEqual(res.body, currencyRates);
});
