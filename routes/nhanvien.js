var express = require('express');
var router = express.Router();
var NhanVien = require('../models/nhanvien');
var Luong = require('../models/luong');
var ChamCong = require('../models/chamcong');
var PhongBan = require('../models/phongban'); 
var ChucVu = require('../models/chucvu');
var bcrypt = require('bcryptjs');

var salt = bcrypt.genSaltSync(10);
// Cấu hình để lưu ảnh
var multer = require('multer');
var path = require('path');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },
    filename: function (req, file, cb) {
        // Đặt tên file là: thời_gian_hiện_tại + tên_gốc để tránh trùng
        cb(null, Date.now() + "_" + file.originalname);
    }
});
var upload = multer({ storage: storage });

// Tự sinh email
function TaoEmail(maNV, quyenHan) {
    // Chuyển Mã NV thành chữ thường, bỏ khoảng trắng
    var manv = maNV.toLowerCase().replace(/\s+/g, "");
    
    // Chuyển Tên chức vụ thành không dấu, chữ thường, bỏ khoảng trắng
    var qh = quyenHan.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/\s+/g, "");

    // Kết hợp: manv@quyenhan -> dth235744@admin
    return `${manv}@${qh}`;
}

// GET: Danh sách nhân viên đang làm việc
router.get('/', async (req, res) => {
    var nv = await NhanVien.find({TrangThai : 'Đang làm việc'}).populate('PhongBanId ChucVuId').sort({PhongBanId : 1}).exec();
    res.render('NhanVien/nhanvien_danglamviec', {
        title: 'Danh sách nhân viên ',
        nhanvien: nv
    });
});

// GET: Danh sách nhân viên đã nghỉ việc
router.get('/danhsachnghi', async (req, res) => {
    var nv = await NhanVien.find({ TrangThai: 'Đã nghỉ việc' }).populate('PhongBanId ChucVuId').sort({PhongBanId : 1}).exec();
    
    res.render('NhanVien/nhanvien_danghiviec', { // Fen tạo thêm 1 file view tương tự nhanvien.ejs
        title: 'Danh sách nhân viên đã nghỉ việc',
        nhanvien: nv
    });
});

// GET: Thêm nhân viên
router.get('/them', async (req, res) => {
    var pb = await PhongBan.find();
    var cv = await ChucVu.find();
    res.render('NhanVien/nhanvien_them', {
        title: 'Thêm nhân viên mới',
        phongban: pb,
        chucvu: cv
    });
});
// POST: Thêm nhân viên
router.post('/them', upload.single('AnhDaiDien'), async (req, res) => {
    // Nếu có chọn file, lấy tên file đã lưu, nếu không để trống  
    var maNhanVien = req.body.MaNhanVien;
    var chucVuId = req.body.ChucVuId;
    var quyenHan = req.body.QuyenHan || 'nhanvien';
    var hinhAnh = req.file ? req.file.filename : "";
    var email = TaoEmail(maNhanVien, quyenHan);
    var heSoLuong = req.body.HeSoLuong;
    // 1. KIỂM TRA TRÙNG MÃ
    var checkMa = await NhanVien.findOne({ MaNhanVien: maNhanVien });
    if (checkMa) {
        // Nếu trùng, lấy lại dữ liệu phòng ban/chức vụ để render lại trang thêm
        var pb = await PhongBan.find();
        var cv = await ChucVu.find(); 
        return res.render('NhanVien/nhanvien_them', {
            title: 'Thêm nhân viên mới',
            phongban: pb,
            chucvu: cv,
            oldData: req.body, // Giữ lại các dữ liệu người dùng đã nhập
            error: "Mã nhân viên '" + maNhanVien + "' đã tồn tại trên hệ thống!" 
        });
    }
    var data = {
        MaNhanVien: maNhanVien,
        HoTen: req.body.HoTen,  
        Email: email,
        AnhDaiDien: hinhAnh,
        MatKhau: bcrypt.hashSync('123456', salt),          // Mật khẩu mặc định
        SoDienThoai: req.body.SoDienThoai,
        NgaySinh: req.body.NgaySinh,
        GioiTinh: req.body.GioiTinh,
        PhongBanId: req.body.PhongBanId,
        ChucVuId: chucVuId,
        QuyenHan: req.body.QuyenHan || 'nhanvien',
        TrangThai: 'Đang làm việc',
        HeSoLuong: heSoLuong
    };
    await NhanVien.create(data);
    res.redirect('/nhanvien');
});
// GET: Sửa nhân viên
router.get('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var nv = await NhanVien.findById(id);
    var pb = await PhongBan.find();
    var cv = await ChucVu.find();
    res.render('NhanVien/nhanvien_sua', {
        title: 'Sửa nhân viên',
        nhanvien: nv,
        phongban: pb,
        chucvu: cv
    });
});
// POST: Sửa nhân viên
router.post('/sua/:id', upload.single('AnhDaiDien'), async (req, res) => {
    var id = req.params.id;
    var maNV = req.body.MaNhanVien;
    var chucVuId = req.body.ChucVuId;
    var quyenHan = req.body.QuyenHan;
    var emailMoi = TaoEmail(maNV, quyenHan);
    var heSoLuong = req.body.HeSoLuong;
    var data = {
        HoTen: req.body.HoTen,
        Email: emailMoi, // Cập nhật email mới đã sinh tự động
        SoDienThoai: req.body.SoDienThoai,
        NgaySinh: req.body.NgaySinh,
        GioiTinh: req.body.GioiTinh,
        PhongBanId: req.body.PhongBanId,
        ChucVuId: chucVuId,
        QuyenHan: req.body.QuyenHan,
        TrangThai: req.body.TrangThai,
        HeSoLuong: heSoLuong
    };
    // Nếu người dùng có chọn file mới thì cập nhật tên file
    if (req.file) {
        data.AnhDaiDien = req.file.filename;
    }
    // Nếu người dùng có nhập mật khẩu mới thì mới cập nhật mật khẩu
    if (req.body.MatKhau && req.body.MatKhau.trim() !== "") 
    {
        data.MatKhau = bcrypt.hashSync(req.body.MatKhau, salt);
    }
    await NhanVien.findByIdAndUpdate(id, data);
    res.redirect('/nhanvien');
});

// GET: Hồ sơ cá nhân nhân viên
router.get('/hoso', async (req, res) => {
    if (!req.session.user) {
        // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
        return res.redirect('/dangnhap'); 
    }
    var id = req.session.user._id;
    // Truy vấn dữ liệu người đang đăng nhập
    var nv = await NhanVien.findById(id).populate('PhongBanId ChucVuId');

    res.render('NhanVien/nhanvien_hoso', {
        title: 'Hồ sơ cá nhân',
        nhanvien: nv
    });
});

// GET: Đổi mật khẩu
router.get('/doimatkhau', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/dangnhap');
    }
    res.render('NhanVien/nhanvien_doimatkhau', {
        title: 'Đổi mật khẩu'
    });
});

// POST: Xử lý đổi mật khẩu
router.post('/doimatkhau', async (req, res) => {
    // Kiểm tra xem session người dùng có tồn tại không
    if (!req.session.user) {
        req.session.error = "Vui lòng đăng nhập để thực hiện chức năng này.";
        return res.redirect('/dangnhap');
    }
    var MatKhauCu = req.body.MatKhauCu;
    var MatKhauMoi = String(req.body.MatKhauMoi).trim();
    var XacNhanMatKhau = String(req.body.XacNhanMatKhau).trim();
    var id = req.session.user._id;
    // Truy vấn dữ liệu người đang đăng nhập
    var nv = await NhanVien.findById(id).populate('PhongBanId ChucVuId');
    if (!bcrypt.compareSync(MatKhauCu, nv.MatKhau)) {
        req.session.error = "Mật khẩu hiện tại không chính xác.";
        return res.redirect('/error');
    }
    if (MatKhauMoi !== XacNhanMatKhau) {
        req.session.error = "Mật khẩu mới và xác nhận không khớp.";
        return res.redirect('/error');
    }
    var salt = bcrypt.genSaltSync(10);
    nv.MatKhau = bcrypt.hashSync(MatKhauMoi, salt);
    await nv.save();
    res.send("<script>alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.'); window.location.href='/dangxuat';</script>");
});

// GET: Xử lý cho nghỉ việc (Xóa tạm)
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;
    // Cập nhật trạng thái thành 'Đã nghỉ việc'
    await NhanVien.findByIdAndUpdate(id, { TrangThai: 'Đã nghỉ việc' });
    res.redirect('/nhanvien');
});

// GET: Khôi phục nhân viên (đi làm lại)
router.get('/khoiphuc/:id', async (req, res) => {
    await NhanVien.findByIdAndUpdate(req.params.id, { TrangThai: 'Đang làm việc' });
    res.redirect('/nhanvien');
});

// GET: Xóa nhân viên (xóa vĩnh viễn)
router.get('/xoavinhvien/:id', async (req, res) => {
    var id = req.params.id;
    var xacNhanXoa = req.query.confirm; // Lấy tham số ?confirm=true từ URL

    // Nếu người dùng ĐÃ bấm nút xác nhận xóa sạch (có ?confirm=true)
    if (xacNhanXoa === 'true') {
        await Luong.deleteMany({ NhanVien: id });
        await ChamCong.deleteMany({ NhanVienId: id });
        await NhanVien.findByIdAndDelete(id);
        return res.redirect('/nhanvien/danhsachnghi');
    }

    // Nếu bấm xóa lần đầu: Kiểm tra xem có dữ liệu liên quan không
    var checkLuong = await Luong.findOne({ NhanVien: id });
    var checkCC = await ChamCong.findOne({ NhanVienId: id });

    if (checkLuong || checkCC) {
        var dsNV = await NhanVien.find({ TrangThai: 'Đã nghỉ việc' }).populate('PhongBanId ChucVuId');
        
        // Tìm thông tin của chính nhân viên đang định xóa để lấy cái tên
        var nvDangXoa = await NhanVien.findById(id); 

        return res.render('NhanVien/nhanvien_danghiviec', {
            title: 'Danh sách nhân viên đã nghỉ việc',
            nhanvien: dsNV,
            errorId: id, 
            // Thêm tên nhân viên vào thông báo
            info: "Bạn đang định xóa vĩnh viễn nhân viên: " + nvDangXoa.HoTen + ". Người này đã có dữ liệu Lương/Chấm công. Xóa là mất sạch đấy!"
        });
    }
    // Nếu không có dữ liệu liên quan thì xóa thẳng
    await NhanVien.findByIdAndDelete(id);
    res.redirect('/nhanvien/danhsachnghi');
});
module.exports = router;