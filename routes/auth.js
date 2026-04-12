var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var NhanVien = require('../models/nhanvien');

//GET: Đăng nhập
router.get('/dangnhap', async (req, res) => {
    if(req.session.user)    // Lưu cả Object nhân viên
    {
        req.session.error = "Bạn đã đăng nhập rồi!";
        return res.redirect('/');  //Đưa về trang chủ
    }
    else
        res.render('DangNhap/dangnhap', { title: 'Đăng nhập'});
});

//POST:Đăng nhập
router.post('/dangnhap', async (req, res) => {
    if (req.session.user) {
        req.session.error = 'Người dùng đã đăng nhập rồi.';
        res.redirect('/error');
    } else {
        var email = req.body.Email;
        var matkhau = req.body.MatKhau;

        // Tìm nhân viên bằng Email
        var nhanvien = await NhanVien.findOne({ Email: email }).exec();
        
        if (nhanvien) {
            // So sánh mật khẩu với chuỗi mã hóa
            if (bcrypt.compareSync(matkhau, nhanvien.MatKhau)) {
                
                // Kiểm tra trạng thái làm việc (tương đương KichHoat == 0 trong hình)
                if (nhanvien.TrangThai == 'Đã nghỉ việc') {
                    req.session.error = 'Tài khoản bị khóa do nhân viên đã nghỉ việc.';
                    res.redirect('/error');
                } else {
                    // Đăng ký session theo cách của hình bạn gửi
                    req.session.user = nhanvien;
                    res.redirect('/'); 
                }
            } else {
                req.session.error = 'Mật khẩu không chính xác.';
                res.redirect('/error');
            }
        } else {
            // Không tìm thấy Email
            req.session.error = 'Email đăng nhập không tồn tại.';
            res.redirect('/error');
        }
    }
});

// GET: Đăng xuất
router.get('/dangxuat', async(req, res) => {
    if (req.session.user) {
        // Xóa session user
        delete req.session.user;
        res.redirect('/dangnhap');
    } else {
        res.redirect('/dangnhap');
    }
});

module.exports = router;