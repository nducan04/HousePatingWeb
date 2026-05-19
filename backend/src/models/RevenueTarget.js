const mongoose = require('mongoose');

const revenueTargetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['month', 'quarter', 'year'],
    required: true,
    description: 'Phân loại mục tiêu theo tháng, quý hoặc năm'
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    default: null
  },
  quarter: {
    type: Number,
    default: null
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0,
    description: 'Số tiền mục tiêu kế hoạch (VNĐ)'
  }
}, { 
  timestamps: true 
});

// Đánh index unique cho tổ hợp các trường để đảm bảo không bị trùng lặp mục tiêu 
// trong cùng một mốc thời gian (ví dụ: không thể có 2 mục tiêu cho Tháng 1/2026).
revenueTargetSchema.index({ type: 1, year: 1, month: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('RevenueTarget', revenueTargetSchema, 'RevenueTargets');
