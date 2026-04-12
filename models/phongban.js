var mongoose = require('mongoose');
const phongBanSchema = new mongoose.Schema
({
    TenPhongBan: { type: String, unique: true, required: true },
    MoTa: {type: String },
    // Lấy mã nhân viên có vai trò trưởng phòng trong bảng nhân viên
    TruongPhongId: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' }
});
var PhongBanModel = mongoose.model('PhongBan', phongBanSchema);
module.exports = PhongBanModel;