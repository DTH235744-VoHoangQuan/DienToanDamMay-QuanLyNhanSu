var express = require('express');
var router = express.Router();
var ChucVu = require('../models/chucvu');
var NhanVien = require('../models/nhanvien');
// GET: Danh sách chức vụ
router.get('/', async (req, res) => {
    var cv = await ChucVu.find();
    res.render('ChucVu/chucvu', {
        title: 'Danh sách chức vụ',
        chucvu: cv
    });
});
// GET: Thêm chức vụ
router.get('/them', async (req, res) => {
    res.render('ChucVu/chucvu_them', {
        title: 'Thêm chức vụ'
    });
});
// POST: Thêm chức vụ
router.post('/them', async (req, res) => {
    var data = {
        TenChucVu: req.body.TenChucVu,
        LuongCoBan: req.body.LuongCoBan,
        PhuCap: req.body.PhuCap,
        GioVaoLam: req.body.GioVaoLam,
        GioTanCa: req.body.GioTanCa
    };
    await ChucVu.create(data);
    res.redirect('/chucvu');
});
// GET: Sửa chức vụ
router.get('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var cv = await ChucVu.findById(id);
    res.render('ChucVu/chucvu_sua', {
        title: 'Sửa chức vụ',
        chucvu: cv
    });
});
// POST: Sửa chức vụ
router.post('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var data = {
        TenChucVu: req.body.TenChucVu,
        LuongCoBan: req.body.LuongCoBan,
        PhuCap: req.body.PhuCap,
        GioVaoLam: req.body.GioVaoLam,
        GioTanCa: req.body.GioTanCa
    };
    await ChucVu.findByIdAndUpdate(id, data);
    res.redirect('/chucvu');
});
// GET: Xóa chức vụ
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;     // id chức vụ
    // Kiểm tra nếu vai trò đang được áp dụng trong bảng khác thì không được xóa
    var checkNV = await NhanVien.findOne({ ChucVuId: id});
    if (checkNV)
    {
        var cv = await ChucVu.find();
        return res.render('ChucVu/chucvu', {
            title: 'Danh sách chức vụ',
            chucvu: cv,
            info: 'Đang có nhân viên thuộc chức vụ này. Không thể xóa!'
        });
    }
    await ChucVu.findByIdAndDelete(id);
    res.redirect('/chucvu');
});
module.exports = router;