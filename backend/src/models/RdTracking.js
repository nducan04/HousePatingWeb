const mongoose = require('mongoose');

const rdTrackingSchema = new mongoose.Schema(
    {
        MaNhatKy: { type: String, required: true, unique: true },
        ContractID: { type: mongoose.Schema.Types.ObjectId, ref: 'HopDong' },
        MaMauYeuCau: { type: String, required: true },
        customerName: { type: String },
        colorName: { type: String },
        surface: { type: String },
        substrate: { type: String },
        deadline: { type: Date },
        requirements: { type: String },
        environmentType: { type: String },
        imageUrl: { type: String },
        TrangThai: { 
            type: String, 
            enum: ['pending', 'testing', 'approved', 'rejected', 'complete', 'completed'], 
            default: 'pending' 
        },
        NguoiPhuTrach: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
        GhiChu: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model('RDTracking', rdTrackingSchema, 'RDTrackings');