const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderRole: { type: String, required: true }, // 'KhachHang', 'NhanVien', 'Admin'
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

const chatSessionSchema = new mongoose.Schema({
  KhachHangID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
    required: true
  },
  NhanVienID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien'
  },
  MaDonHang: {
    type: String,
    default: ''
  },
  Topic: {
    type: String,
    default: 'Hỗ trợ chung'
  },
  Status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  Messages: [messageSchema],
  LastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSession', chatSessionSchema, 'ChatSessions');
