const mongoose = require('mongoose');

const CATEGORIES = ['Power Tools', 'Hand Tools', 'Gardening', 'Home & Cleaning', 'Kitchen', 'Ladders', 'Outdoor', 'Other']; // keep in sync with client/src/constants.js
const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair', 'Heavy Duty'];

const toolSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Tool name is required'], trim: true, maxlength: 90 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    subcategory: { type: String, trim: true, maxlength: 40, default: '' },
    condition: { type: String, enum: CONDITIONS, default: 'Good' },
    locality: { type: String, trim: true, default: '' },
    city: { type: String, required: [true, 'City is required'], trim: true },
    country: { type: String, trim: true, default: 'India' },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    imageUrl: { type: String, trim: true, default: '' },
    pricePerDay: { type: Number, min: 0, default: 0 }, // INR, 0 = free
    deposit: { type: Number, min: 0, default: 0 }, // INR, refundable
    instantBook: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tool', toolSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
