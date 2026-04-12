var mongoose = require('mongoose');
const chamCongSchema = new mongoose.Schema
({
    NhanVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    NgayChamCong: { type: Date, default: Date.now },
    GioVao: String, // Ví dụ: "08:00"
    GioRa: String,  // Ví dụ: "17:30"
    TrangThai: { type: String }
})
var ChamCongModel = mongoose.model('ChamCong', chamCongSchema);
module.exports = ChamCongModel;