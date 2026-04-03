const mongoose = require('mongoose');

/**
 * Sub-document: Lịch sử trả lời (nhúng vào PhanHoiHoTro)
 * Theo BRD: Toàn bộ cuộc hội thoại (AI Chatbot, Nhân viên CSKH) được đẩy liên tục vào mảng.
 */
const lichSuTraLoiSchema = new mongoose.Schema({
  NguoiTraLoi: {
    type: String,
    enum: ['AI', 'NhanVien', 'KhachHang'],
    required: true,
  },
  NoiDung: {
    type: String,
    required: true,
  },
  ThoiGian: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

/**
 * Collection: PhanHoiHoTro (Phản hồi hỗ trợ / Ticket CSKH)
 * Theo BRD: Ghi nhận toàn bộ tương tác tư vấn kỹ thuật, khiếu nại
 * giữa khách hàng với AI hoặc Nhân viên CSKH.
 */
const phanHoiHoTroSchema = new mongoose.Schema({
  MaPhanHoi: {
    type: String,
    required: [true, 'Vui lòng nhập mã phản hồi'],
    unique: true,
    trim: true,
  },
  CustomerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KhachHang',
  },
  PhanLoai: {
    type: String,
    required: [true, 'Vui lòng chọn phân loại'],
    enum: ['Tư vấn màu', 'Hỗ trợ kỹ thuật', 'Khiếu nại', 'Đóng góp ý kiến'],
  },
  NoiDungYeuCau: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung yêu cầu'],
  },
  TrangThai: {
    type: String,
    enum: ['Đang mở', 'Đang xử lý', 'Đã đóng'],
    default: 'Đang mở',
  },
  // Nhân viên CSKH phụ trách (nếu escalate từ AI)
  AssignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NhanVien',
  },
  // Mảng nhúng (Embedded) — LichSuTraLoi
  LichSuTraLoi: [lichSuTraLoiSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('PhanHoiHoTro', phanHoiHoTroSchema, 'PhanHoiHoTros');
