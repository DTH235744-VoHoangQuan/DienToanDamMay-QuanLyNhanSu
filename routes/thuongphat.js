var express = require('express');
var router = express.Router();
var ThuongPhat = require('../models/thuongphat');
var NhanVien = require('../models/nhanvien');
// GET: Danh sách thưởng phạt
router.get('/', async (req, res) => {
    var tp = await ThuongPhat.find().populate('NhanVienId');
    res.render('ThuongPhat/thuongphat', {
        title: "Danh sách thưởng phạt",
        thuongphat: tp
    })
});
// GET: Thêm thưởng phạt    
router.get('/them', async (req, res) => {
    var nv = await NhanVien.find();
    res.render('ThuongPhat/thuongphat_them', {
        title: 'Ghi nhận Thưởng/Phạt mới',
        nhanvien: nv
    });
});
// POST: Thêm thưởng phạt
router.post('/them', async (req, res) => {
    // Nếu chọn "Tất cả nhân viên"
    if (req.body.NhanVienId === 'all') {
        var nv = await NhanVien.find();
        
        // Tạo mảng dữ liệu thưởng/phạt tất cả
        var data = nv.map(nv => {
            return {
                NhanVienId: nv._id,
                Loai: req.body.Loai,
                SoTien: req.body.SoTien,
                LyDo: req.body.LyDo,
                NgayQuyetDinh: req.body.NgayQuyetDinh || new Date
            }; 
        });
        
        await ThuongPhat.insertMany(data);
    } 
    // Nếu chọn đích danh 1 nhân viên
    else {
        var data = {
            NhanVienId: req.body.NhanVienId,
            Loai: req.body.Loai,
            SoTien: req.body.SoTien,
            LyDo: req.body.LyDo,
            NgayQuyetDinh: req.body.NgayQuyetDinh || new Date
        };
        
        await ThuongPhat.create(data);
    }
    
    res.redirect('/thuongphat');
});
// GET: Sửa thưởng phạt
router.get('/sua/:id', async (req, res) => {
    var tp = await ThuongPhat.findById(req.params.id);
    var nv = await NhanVien.find();
    res.render('ThuongPhat/thuongphat_sua', {
        title: 'Sửa Thưởng/Phạt',
        item: tp,
        nhanvien: nv
    });
});
// POST: Sửa thưởng phạt
router.post('/sua/:id', async (req, res) => {
    await ThuongPhat.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/thuongphat');
});
// GET: Xóa thưởng phạt
router.get('/xoa/:id', async (req, res) => {
    await ThuongPhat.findByIdAndDelete(req.params.id);
    res.redirect('/thuongphat');
});
module.exports = router;