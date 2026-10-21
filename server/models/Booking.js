const mongoose = require('mongoose');

const STATUSES = ['pending', 'approved', 'declined', 'cancelled', 'returned'];

const bookingSchema = new mongoose.Schema(
  {
    tool: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    days: { type: Number, min: 1, default: 1 },
    rentalCost: { type: Number, min: 0, default: 0 }, // INR rental fee for the whole period
    deposit: { type: Number, min: 0, default: 0 }, // INR refundable deposit at booking time
    instant: { type: Boolean, default: false }, // auto-approved instant booking
    pickupWindow: { type: String, trim: true, maxlength: 60, default: '' },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending' },
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, trim: true, maxlength: 500 },
      createdAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.STATUSES = STATUSES;
