var mongoose = require('mongoose');
const chucVuSchema = new mongoose.Schema
({
    TenChucVu: {type: String, unique: true, required: true},
    LuongCoBan: {type: Number, default: 0},
    PhuCap: {type: Number, default: 0},
    GioVaoLam: { type: String, default: "08:00" }, 
    GioTanCa: { type: String, default: "17:00" }
})
var ChucVuModel = mongoose.model('ChucVu', chucVuSchema);
module.exports = ChucVuModel;