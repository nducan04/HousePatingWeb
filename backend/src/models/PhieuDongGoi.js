const mongoose = require('mongoose');

const packagingSpecsSchema = new mongoose.Schema({
  containerType: { type: String, required: true }, // VD: Thùng 20L, Lon 5L
  quantity: { type: Number, required: true },       // Số lượng bao bì
  unitWeight: { type: Number, required: true },      // Khối lượng tịnh mỗi đơn vị (Thùng)
  totalWeight: { type: Number, required: true }      // Tổng khối lượng dòng này
}, { _id: false });

const phieuDongGoiSchema = new mongoose.Schema({
  MaPhieuDongGoi: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  RDLogID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhatKyTestMau'
  },
  ContractID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HopDong'
  },
  OrderID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonHang'
  },
  PackagingSpecs: [packagingSpecsSchema],
  PackagingMaterial: { type: String, default: 'Thùng nhựa tiêu chuẩn AkzoNobel' },
  NetWeightTotal: { type: Number, default: 0 },
  CreatedBy: { type: String }, // Tên nhân viên thực hiện
  Notes: { type: String },
  TrangThai: {
    type: String,
    enum: ['packed', 'waiting_pickup', 'shipped', 'cancelled'],
    default: 'packed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhieuDongGoi', phieuDongGoiSchema, 'PhieuDongGois');
