var express = require('express');
var router = express.Router();
var DonNghiPhep = require('../models/donnghiphep');
var NhanVien = require('../models/nhanvien');
var PhongBan = require('../models/phongban');
var ChamCong = require('../models/chamcong');

// GET: Danh sách đơn nghỉ phép
router.get('/', async (req, res) => {
    // Nếu chưa đăng nhập thì chuyển về trang đăng nhập
    if (!req.session.user) {
        return res.redirect('/dangnhap');
    }
    var locTrangThai = req.query.trangThai;
    var locPhongBan = req.query.phongBan;
    var locLoaiDon = req.query.loaiDon;
    // Tạo query ban đầu
    var query = {};
    // Nếu là nhân viên thì chỉ xem đơn của chính mình
    if (req.session.user.QuyenHan === 'nhanvien') {
        query.NhanVienId = req.session.user._id;
    }
    // Lấy dữ liệu từ DB (lọc ngay từ đầu)
    var dnp = await DonNghiPhep.find(query)
        .populate({ path: 'NhanVienId', populate: { path: 'PhongBanId' } })
        .populate('NguoiDuyetId')
        .sort({ NgayGui: -1 });

    var pb = await PhongBan.find();
    // Lọc thêm (trạng thái, loại đơn, phòng ban)
    var duLieuLoc = dnp.filter(don => {
        if (locTrangThai && don.TrangThai !== locTrangThai) return false;
        if (locLoaiDon && don.LoaiDon !== locLoaiDon) return false;
        if (locPhongBan) {
            var phongBanId = don.NhanVienId?.PhongBanId?._id?.toString();
            if (phongBanId !== locPhongBan) return false;
        }
        return true;
    });
    res.render('DonNghiPhep/donnghiphep', {
        title: 'Danh sách đơn nghỉ phép',
        donnghiphep: duLieuLoc,
        phongban: pb,
        user: req.session.user,
        boLocDaChon: {
            trangThai: locTrangThai,
            phongBan: locPhongBan,
            loaiDon: locLoaiDon
        }
    });
});

// GET: Thêm đơn nghỉ phép
router.get('/them', async (req, res) => {
    var nv = await NhanVien.find();
    res.render('DonNghiPhep/donnghiphep_them', {
        title: 'Thêm đơn nghỉ phép',
        nhanvien: nv
    });
});
// POST: Thêm đơn nghỉ phép
router.post('/them', async (req, res) => {
    if (!req.session.user) {
            // Nếu chưa có session, không cho chạy tiếp mà bắt đăng nhập lại
            return res.redirect('/dangnhap'); 
        }
    var data = {
        NhanVienId: req.session.user._id,
        LoaiDon: req.body.LoaiDon,
        TuNgay: req.body.TuNgay,
        DenNgay: req.body.DenNgay,
        LyDo: req.body.LyDo,
        // Tự động hóa các thông tin hệ thống
        TrangThai: 'Chờ duyệt', 
        NgayGui: new Date()
    }
    await DonNghiPhep.create(data);
    res.redirect('/donnghiphep');
});

// POST: Duyệt đơn nghỉ phép
router.post('/duyet/:id', async (req, res) => {
    var idDon = req.params.id;
        var trangThaiMoi = req.body.TrangThai; // 'Đã duyệt' hoặc 'Từ chối'
        // Kiểm tra session
        if (!req.session.user) {
            // Nếu chưa đăng nhập mà bấm duyệt thì báo lỗi hoặc đẩy về trang login
            return res.redirect('/'); 
        }
        var idAdmin = req.session.user._id; // Lấy ID của người đang đăng nhập từ Session
        var don = await DonNghiPhep.findByIdAndUpdate(idDon, {
                                                        TrangThai: trangThaiMoi,
                                                        NguoiDuyetId: idAdmin, // Ghi nhận người duyệt là người đang login
                                                        new: true }); // Lấy kết quả cập nhật mới nhất
        // Nếu đơn được duyệt, tự động ghi nhận vào bảng Chấm công
        if (trangThaiMoi === 'Đã duyệt' && don) {
            var ngayBatDau = new Date(don.TuNgay);
            var ngayKetThuc = new Date(don.DenNgay);

            // Chạy vòng lặp từ ngày bắt đầu đến ngày kết thúc đơn xin nghỉ
            for (var d = new Date(ngayBatDau); d <= ngayKetThuc; d.setDate(d.getDate() + 1)) 
            {    
                // Kiểm tra xem ngày này đã có bản ghi chấm công chưa
                var ngayHienTai = new Date(d);
                var checkCC = await ChamCong.findOne({
                    NhanVienId: don.NhanVienId,
                    NgayChamCong: {
                        $gte: new Date(ngayHienTai.setHours(0,0,0,0)),
                        $lte: new Date(ngayHienTai.setHours(23,59,59,999))
                    }
                });
                // Nếu có rồi bảng chấm công rồi thì cập nhật, chưa có thì tạo mới
                var dataChamCong = {
                    NhanVienId: don.NhanVienId,
                    NgayChamCong: new Date(d),
                    GioVao: '08:00', 
                    GioRa: '17:00',
                    TrangThai: 'Nghỉ có phép'
                };

                if (!checkCC) {
                    // Nếu chưa có bất kỳ bản ghi nào (nghỉ cả ngày)
                    await ChamCong.create(dataChamCong);
                } else {
                    // Nếu đã có thì ghi đè lên thông tin cũ
                    await ChamCong.findByIdAndUpdate(checkCC._id, dataChamCong);
                }
            }
        }
        res.redirect('/donnghiphep');
});

// GET: Xóa đơn nghỉ phép
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;
    await DonNghiPhep.findByIdAndDelete(id);
    res.redirect('/donnghiphep');
});
module.exports = router;