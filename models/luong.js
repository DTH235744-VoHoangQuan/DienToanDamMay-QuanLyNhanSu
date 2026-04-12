var mongoose = require('mongoose');
const luongSchema = new mongoose.Schema
({
    NhanVien: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien' },
    Thang: Number,
    Nam: Number,
    SoNgayCong: Number,
    SoLanMuon: Number,
    HeSoLuong: Number,
    TongLuong: Number,
    GhiChu: String
})
var LuongModel = mongoose.model('Luong', luongSchema);
module.exports = LuongModel;