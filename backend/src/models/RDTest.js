const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  parameters: {
    type: String,
    required: true
  },
  feedback: {
    type: String
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'pending'],
    default: 'pending'
  },
  tester: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const rdTestSchema = new mongoose.Schema({
  requestCode: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  surface: {
    type: String,
    required: true
  },
  requirements: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'testing', 'approved', 'rejected'],
    default: 'pending'
  },
  versions: [versionSchema],
  signedBy: {
    type: String
  },
  signedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating pass rate automatically
rdTestSchema.virtual('passRate').get(function() {
  if (!this.versions || this.versions.length === 0) return 0;
  const passCount = this.versions.filter(v => v.result === 'pass').length;
  return Math.round((passCount / this.versions.length) * 100);
});

module.exports = mongoose.model('RDTest', rdTestSchema);
