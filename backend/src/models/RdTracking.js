import mongoose from 'mongoose';

const rdTrackingSchema = new mongoose.Schema(
    {
        MaNhatKy: {
            type: String,
            required: true,
            unique: true,
        },
        ContractID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HopDong', // Liên kết tới bảng Hợp đồng
            required: true,
        },
        MaMauYeuCau: {
            type: String,
            required: true,
        },
        TrangThai: {
            type: String,
            enum: ['pending', 'testing', 'completed', 'failed'],
            default: 'pending',
        },
        // Có thể bổ sung thêm người phụ trách, kết quả KCS...
        NguoiPhuTrach: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NhanVien',
        },
        GhiChu: {
            type: String,
        }
    },
    {
        timestamps: true, // Tự động có createdAt, updatedAt
    }
);

// Tránh lỗi đè model trong Next.js (do hot-reload)
const RDTracking = mongoose.models.RDTracking || mongoose.model('RDTracking', rdTrackingSchema);

export default RDTracking;