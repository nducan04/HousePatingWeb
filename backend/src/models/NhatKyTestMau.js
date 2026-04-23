const mongoose = require('mongoose');

// Sub-document: Lịch sử các lần test mẫu
const lichSuPhienBanSchema = new mongoose.Schema({
  version: { type: String, required: true }, // V1.0, V1.1
  date: { type: Date, default: Date.now },
  result: { type: String, enum: ['pass', 'fail', 'pending'], default: 'pending' },
  parameters: { type: String, required: true },
  feedback: { type: String },
  inputWeight: { type: Number, default: 0 }, // Khối lượng đầu vào (kg)
  outputWeight: { type: Number, default: 0 }, // Khối lượng thực thu (kg)
  images: [{ type: String }], // Mảng URL ảnh (để sau này gắn ImageKit)
  tester: { type: String, required: true },
  testerCode: { type: String, default: '' }
}, { _id: false });

const nhatKyTestMauSchema = new mongoose.Schema({
  MaNhatKy: { type: String, required: true, unique: true },
  ContractID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'HopDong', 
    required: [true, 'R&D phải gắn với một Hợp đồng'] 
  },
  MaMauYeuCau: { type: String, required: true },
  TrangThai: { 
    type: String, 
    enum: ['pending', 'testing', 'approved', 'rejected'], 
    default: 'pending' 
  },
  LichSuPhienBan: [lichSuPhienBanSchema],
  signedBy: { type: String },
  signedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('NhatKyTestMau', nhatKyTestMauSchema, 'NhatKyTestMaus');
