var express = require('express');
var router = express.Router();
var ChamCong = require('../models/chamcong');
var NhanVien = require('../models/nhanvien');

// Tìm kiếm nhân viên
router.get('/timkiem', async (req, res) => {
    try {
        var q = req.query.q || '';

        var ds = await NhanVien.find({
            HoTen: { $regex: q, $options: 'i' }
        })
        .limit(10)
        .select('_id HoTen');

        res.json(ds);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Lấy nhân viên theo id
router.get('/getbyid/:id', async (req, res) => {
    try {
        const nv = await NhanVien.findById(req.params.id)
            .select('_id HoTen');

        res.json(nv);
    } catch (err) {
        res.status(500).json(null);
    }
});

// Không cho vào nếu chưa đăng nhập
router.use((req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/dangnhap');
    }
    next();
});

// GET: Danh sách chấm công (Mặc định hiện ngày hôm nay)
router.get('/', async (req, res) => {
    var locNgay = req.query.ngay;
    var locNhanVien = req.query.nhanVienId;
    // Khởi tạo đối tượng lọc rỗng
    var filter = {};
    // Lọc theo ngày (nếu người dùng chọn)
    if (locNgay) {
        var start = new Date(locNgay);
        start.setHours(0, 0, 0, 0);
        
        var end = new Date(locNgay);
        end.setHours(23, 59, 59, 999);
        
        filter.NgayChamCong = { $gte: start, $lte: end };
    }

    // Lọc theo nhân viên
    if (locNhanVien) {
        filter.NhanVienId = locNhanVien;
    }

    var cc = await ChamCong.find(filter).populate('NhanVienId')
                                        .sort({ NgayChamCong: -1 })
                                        .exec();

    var dsNhanVien = await NhanVien.find();

    res.render('ChamCong/chamcong', {
        title: 'Danh sách chấm công',
        chamcong: cc,
        nhanvien: dsNhanVien,
        boLoc: {
            ngay: locNgay || '',
            nhanVienId: locNhanVien || ''
        }
    });
});
// GET: Thêm chấm công
router.get('/them', async (req, res) => {
    var nv = await NhanVien.find();
    res.render('ChamCong/chamcong_them', {
        title: 'Ghi nhận chấm công mới',
        nhanvien: nv
    })
});
// POST: Thêm chấm công
router.post('/them', async (req, res) => {
    var idNV = req.body.NhanVienId;
    var ngayHienTai = new Date();
    // Tạo biến giờ chung cho cả lúc vào và lúc ra
    var gioHienTai = ngayHienTai.getHours().toString().padStart(2, '0') + ":" +
        ngayHienTai.getMinutes().toString().padStart(2, '0');

    // Tìm bản ghi hôm nay (Sửa lại cách bọc new Date)
    var homNay = await ChamCong.findOne({
        NhanVienId: idNV,
        NgayChamCong: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
    });

    // Lấy thông tin quy định
    var nv = await NhanVien.findById(idNV).populate('ChucVuId');
    var dsNV = await NhanVien.find(); // Dùng để render lại cái Select box

    var gioVaoQuyDinh = nv.ChucVuId.GioVaoLam || "08:00";
    var gioRaQuyDinh = nv.ChucVuId.GioTanCa || "17:00";

    if (!homNay) {
        // TRƯỜNG HỢP 1: VÀO LÀM
        var trangThaiVao = (gioHienTai > gioVaoQuyDinh) ? "Muộn" : "Đúng giờ";

        await ChamCong.create({
            NhanVienId: idNV,
            NgayChamCong: ngayHienTai,
            GioVao: gioHienTai,
            TrangThai: trangThaiVao // Ghi trạng thái đầu tiên
        });

        return res.render('ChamCong/chamcong_them', {
            title: 'Ghi nhận chấm công mới',
            nhanvien: dsNV,
            info: "Chào buổi sáng! Ghi nhận vào làm lúc " + gioHienTai
        });

    } else {
        // TRƯỜNG HỢP 2: RA VỀ
        if (homNay.GioRa) {
            return res.render('ChamCong/chamcong_them', {
                title: 'Ghi nhận chấm công mới',
                nhanvien: dsNV,
                info: 'Bạn đã hoàn thành chấm công hôm nay rồi!'
            });
        }

        var trangThaiRa;
        if (gioHienTai < gioRaQuyDinh) trangThaiRa = " (Về sớm)" 
        else trangThaiRa = " (Đủ giờ)";

        await ChamCong.findByIdAndUpdate(homNay._id, {
            GioRa: gioHienTai,
            // CỘNG DỒN TRẠNG THÁI: Lấy "Muộn" + " (Về sớm)"
            TrangThai: homNay.TrangThai + trangThaiRa
        });

        return res.render('ChamCong/chamcong_them', {
            title: 'Ghi nhận chấm công mới',
            nhanvien: dsNV,
            info: "Tạm biệt! Ghi nhận ra về lúc " + gioHienTai
        });
    }
});
// GET: Sửa chấm công
router.get('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var cc = await ChamCong.findById(id).populate('NhanVienId');
    var nv = await NhanVien.find();
    res.render('ChamCong/chamcong_sua', {
        title: 'Sửa chấm công',
        chamcong: cc,
        nhanvien: nv
    })
});
// POST: Sửa chấm công
router.post('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var data = {
        NhanVienId: req.body.NhanVienId,
        NgayChamCong: req.body.NgayChamCong,
        GioVao: req.body.GioVao,
        GioRa: req.body.GioRa,
        TrangThai: req.body.TrangThai
    }
    await ChamCong.findByIdAndUpdate(id, data);
    res.redirect('/chamcong');
});

// Xem chấm công theo nhân viên
router.get('/nhanvien/:id', async (req, res) => {
    var id = req.params.id;

    var ds = await ChamCong.find({ NhanVienId: id })
        .populate('NhanVienId')
        .sort({ NgayChamCong: -1 });

    var nv = await NhanVien.findById(id);

    res.render('ChamCong/chamcong_nhanvien', {
        title: 'Chấm công nhân viên',
        chamcong: ds,
        nhanvien: nv
    });
});

// Thống kê theo tháng
router.get('/thongke/thang', async (req, res) => {
    var thang = parseInt(req.query.thang) || (new Date().getMonth() + 1);
    var nam = parseInt(req.query.nam) || new Date().getFullYear();

    var start = new Date(nam, thang - 1, 1);
    var end = new Date(nam, thang, 0, 23, 59, 59);

    var data = await ChamCong.find({
        NgayChamCong: { $gte: start, $lte: end }
    }).populate('NhanVienId');

    // thống kê đơn giản
    var tong = data.length;
    var diMuon = data.filter(x => x.TrangThai && x.TrangThai.includes('Muộn')).length;

    res.render('ChamCong/thongke_thang', {
        title: 'Thống kê chấm công',
        tong,
        diMuon,
        thang,
        nam,
        data
    });
});

// GET: Xóa chấm công
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;
    await ChamCong.findByIdAndDelete(id);
    res.redirect('/chamcong')
});
module.exports = router;
