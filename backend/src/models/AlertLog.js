const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  alertType: {
    type: String,
    enum: ['VOLUME_DROP', 'REVENUE_DROP', 'R&D_FAIL'],
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  actual: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sentTo: [{
    type: String
  }],
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AlertLog', alertLogSchema);
