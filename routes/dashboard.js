var express = require('express');
var router = express.Router();

var NhanVien = require('../models/nhanvien');
var PhongBan = require('../models/phongban');
var Luong = require('../models/luong');

// Không cho vào nếu chưa đăng nhập
router.use((req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/dangnhap');
    }
    next();
});

// GET DASHBOARD
router.get('/', async (req, res) => {

    var thang = req.query.thang || new Date().getMonth() + 1;
    var nam = req.query.nam || new Date().getFullYear();

    // Tổng nhân viên
    var tongNhanVien = await NhanVien.countDocuments({ TrangThai: 'Đang làm việc' });

    // Tổng phòng ban
    var tongPhongBan = await PhongBan.countDocuments();

    // Tổng lương tháng
    var dsLuongThang = await Luong.find({
        Thang: thang,
        Nam: nam
    });

    var tongLuongThang = 0;
    for (var i = 0; i < dsLuongThang.length; i++) {
        tongLuongThang += dsLuongThang[i].TongLuong;
    }

    // Tổng lương năm
    var dsLuongNam = await Luong.find({
        Nam: nam
    });

    var tongLuongNam = 0;
    for (var i = 0; i < dsLuongNam.length; i++) {
        tongLuongNam += dsLuongNam[i].TongLuong;
    }
    tongLuongThang = Number(tongLuongThang);
    tongLuongNam = Number(tongLuongNam);
    res.render('DashBoard/dashboard', {
        title: 'Thống kê tổng quan',
        tongNhanVien: tongNhanVien,
        tongPhongBan: tongPhongBan,
        tongLuongThang: tongLuongThang,
        tongLuongNam: tongLuongNam,
        thang: thang,
        nam: nam
    });
});

module.exports = router;