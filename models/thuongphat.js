var mongoose = require('mongoose');
const thuongPhatSchema = new mongoose.Schema({
    NhanVienId: { type: mongoose.Schema.Types.ObjectId, ref: 'NhanVien', required: true },
    Loai: { type: String, enum: ['Khen thưởng', 'Kỷ luật'], required: true },
    SoTien: { type: Number, required: true, default: 0 },
    LyDo: { type: String, required: true },
    NgayQuyetDinh: { type: Date, default: Date.now }
});
var ThuongPhatModel = mongoose.model('ThuongPhat', thuongPhatSchema);
module.exports = ThuongPhatModel;