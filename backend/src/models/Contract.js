const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  escrowPct: {
    type: Number,
    required: true,
    default: 15
  },
  documentHash: {
    type: String
  },
  ipfsCid: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'awaiting', 'signed', 'active', 'completed', 'disputed'],
    default: 'draft'
  },
  vtscAddress: {
    type: String,
    required: true
  },
  clientAddress: {
    type: String,
    required: true
  },
  vtscSignature: {
    type: String
  },
  clientSignature: {
    type: String
  },
  txHash: {
    type: String
  },
  terms: {
    sla: String,
    penalty: String,
    duration: String
  },
  penaltyLog: [{
    reason: String,
    amount: Number,
    date: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Contract', contractSchema);
