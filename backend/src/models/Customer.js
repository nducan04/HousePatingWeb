const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  segment: {
    type: String,
    enum: ['B2B_PROJECT', 'B2B_MOQ', 'B2C'],
    required: true
  },
  moq: {
    type: Number,
    default: 0
  },
  targetVolume: {
    type: Number,
    default: 0
  },
  assignedSale: {
    type: String,
    required: true,
    trim: true
  },
  isHighRisk: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
