const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    required: true
  },
  period: {
    month: { type: Number, required: true },
    year: { type: Number, required: true }
  },
  targetKg: {
    type: Number,
    required: true
  },
  actualKg: {
    type: Number,
    default: 0
  },
  targetRevenue: {
    type: Number,
    required: true
  },
  actualRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure one target per customer per month
salesTargetSchema.index({ customer: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
