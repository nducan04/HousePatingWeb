const mongoose = require('mongoose');

const materialRequirementSchema = new mongoose.Schema({
  NguyenVatLieu: { type: mongoose.Schema.Types.ObjectId, ref: 'NguyenVatLieu' },
  MaNVL: String,
  TenNVL: String,
  TiLe: Number,
  KhoiLuongDuToan: Number // Kg
}, { _id: false });

const lenhSanXuatSchema = new mongoose.Schema({
  MaLenhSanXuat: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  ContractID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HopDong',
    required: true
  },
  CongThucID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CongThuc',
    required: true
  },
  TargetWeight: {
    type: Number,
    required: true,
    min: [1, 'Khối lượng sản xuất tối thiểu là 1kg']
  },
  Assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
    required: true
  },
  ProductionLine: {
    type: String,
    enum: ['Line 01', 'Line 02', 'Line 03', 'Line 04'],
    default: 'Line 01'
  },
  TrangThai: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  MaterialRequirements: [materialRequirementSchema],
  StartTime: { type: Date, default: Date.now },
  CompletionTime: { type: Date },
  GhiChu: String
}, {
  timestamps: true
});

module.exports = mongoose.model('LenhSanXuat', lenhSanXuatSchema, 'LenhSanXuats');
