const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PRICE_LIMITS,
  normalizePriceFields,
  parseSearchCoordinates,
} = require('../utils/toolValidation');

test('accepts price and deposit at their configured maximums', () => {
  const data = { pricePerDay: PRICE_LIMITS.pricePerDay, deposit: PRICE_LIMITS.deposit };
  assert.equal(normalizePriceFields(data), data);
});

test('rejects prices above their configured maximums', () => {
  assert.throws(() => normalizePriceFields({ pricePerDay: 100001 }), { status: 400 });
  assert.throws(() => normalizePriceFields({ deposit: 1000001 }), { status: 400 });
});

test('rejects negative and non-finite prices', () => {
  for (const value of [-1, 'not-a-number', Infinity]) {
    assert.throws(() => normalizePriceFields({ pricePerDay: value }), { status: 400 });
  }
});

test('allows search without optional coordinates', () => {
  assert.equal(parseSearchCoordinates({}), null);
});

test('accepts valid coordinate boundaries', () => {
  assert.deepEqual(parseSearchCoordinates({ lat: '90', lng: '-180' }), { lat: 90, lng: -180 });
  assert.deepEqual(parseSearchCoordinates({ lat: '-90', lng: '180' }), { lat: -90, lng: 180 });
});

test('rejects out-of-range, malformed, and incomplete coordinates', () => {
  for (const query of [
    { lat: '1000', lng: '0' },
    { lat: '0', lng: '181' },
    { lat: '12abc', lng: '0' },
    { lat: '0' },
    { lng: '0' },
    { lat: ['1'], lng: '0' },
  ]) {
    assert.throws(() => parseSearchCoordinates(query), { status: 400 });
  }
});
