var mongoose = require('mongoose');
const nhanVienSchema = new mongoose.Schema
({
    MaNhanVien: {type: String, unique: true, required: true},
    HoTen: {type: String, required: true},
    Email: {type: String, unique: true, required: true}, // Không được trùng email
    MatKhau: {type: String, required: true, default: '123456'},
    SoDienThoai: {type: String},
    NgaySinh: {type: Date},
    GioiTinh: {type: String, enum: ['Nam', 'Nữ']},
    AnhDaiDien: {type: String, },    // Nhớ gán ảnh mặc định vào default: "_____"
    QuyenHan: { type: String, enum: ['admin', 'truongphong', 'nhanvien'], default: 'nhanvien' },
    TrangThai: {type: String, enum: ['Đang làm việc', 'Đã nghỉ việc'], default: 'Đang làm việc'},
    PhongBanId: {type: mongoose.Schema.Types.ObjectId, ref: 'PhongBan'},
    ChucVuId: {type: mongoose.Schema.Types.ObjectId, ref: 'ChucVu'},
    HeSoLuong: {type: Number, default: 1}
})
var NhanVienModel = mongoose.model('NhanVien', nhanVienSchema);
module.exports = NhanVienModel;