const mongoose = require('mongoose');

const chinhSachSchema = new mongoose.Schema({
  LoaiChinhSach: {
    type: String,
    required: true,
    enum: ['DOI_TRA', 'BAO_HANH', 'VAN_CHUYEN', 'HAU_MAI', 'MUA_HANG', 'THANH_TOAN'],
    unique: true
  },
  NoiDung: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ChinhSach', chinhSachSchema);
