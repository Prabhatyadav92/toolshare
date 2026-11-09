const PRICE_LIMITS = Object.freeze({
  pricePerDay: 100000,
  deposit: 1000000,
});

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

function normalizePriceFields(data) {
  for (const field of Object.keys(PRICE_LIMITS)) {
    if (data[field] === undefined) continue;

    const value = Number(data[field]);
    const label = field === 'pricePerDay' ? 'Fee per day' : 'Deposit';
    if (!Number.isFinite(value) || value < 0 || value > PRICE_LIMITS[field]) {
      throw badRequest(`${label} must be between 0 and ${PRICE_LIMITS[field]} INR`);
    }
    data[field] = Math.round(value);
  }
  return data;
}

function parseSearchCoordinates(query) {
  const hasLat = query.lat !== undefined;
  const hasLng = query.lng !== undefined;

  if (!hasLat && !hasLng) return null;
  if (!hasLat || !hasLng) throw badRequest('Both lat and lng are required for location search');

  const parseCoordinate = (value, field, min, max) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw badRequest(`${field} must be a number between ${min} and ${max}`);
    }

    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max) {
      throw badRequest(`${field} must be a number between ${min} and ${max}`);
    }
    return number;
  };

  return {
    lat: parseCoordinate(query.lat, 'lat', -90, 90),
    lng: parseCoordinate(query.lng, 'lng', -180, 180),
  };
}

module.exports = { PRICE_LIMITS, normalizePriceFields, parseSearchCoordinates };
