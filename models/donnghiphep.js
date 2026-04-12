var mongoose = require('mongoose');
const donNghiPhepSchema = new mongoose.Schema({
    NhanVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    LoaiDon: { type: String, enum: ['Nghỉ phép năm', 'Nghỉ ốm', 'Nghỉ việc riêng', 'Nghỉ thai sản'], default: 'Nghỉ phép năm' },
    TuNgay: { type: Date, default: Date.now, required: true },
    DenNgay: { type: Date, default: Date.now, required: true },
    LyDo: { type: String, required: true },
    TrangThai: { type: String, enum: ['Chờ duyệt', 'Đã duyệt', 'Từ chối'], default: 'Chờ duyệt' },
    NguoiDuyetId: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' }, // Trưởng phòng hoặc admin duyệt
    NgayGui: { type: Date, default: Date.now }
});
var DonNghiPhepModel = mongoose.model('DonNghiPhep', donNghiPhepSchema);
module.exports = DonNghiPhepModel;