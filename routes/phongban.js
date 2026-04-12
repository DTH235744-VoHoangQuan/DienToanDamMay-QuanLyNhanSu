var express = require('express');
var router = express.Router();
var PhongBan = require('../models/phongban');
var NhanVien = require('../models/nhanvien');
// GET: Danh sách phòng ban
router.get('/', async (req, res) => {
    var pb = await PhongBan.find().populate('TruongPhongId').sort({ TenPhongBan: 1 }).exec();   
        res.render('PhongBan/phongban', {
            title: 'Danh sách phòng ban',
            phongban: pb
        });
});
// GET: Chi tiết phòng ban: Hiển thị nhân viên thuộc phòng ban đó
router.get('/chitiet/:id', async (req, res) => {
    var id = req.params.id;
    // Lấy thông tin phòng ban hiện tại để hiện tiêu đề
    var pb = await PhongBan.findById(id).populate('TruongPhongId').exec();
    
    // Lấy toàn bộ nhân viên có PhongBanId trùng với id này
    var nv = await NhanVien.find({ PhongBanId: id }).populate('ChucVuId').sort({ HoTen: 1}).exec();

    res.render('PhongBan/phongban_chitiet', {
        title: 'Nhân viên phòng ' + pb.TenPhongBan,
        phongban: pb,
        nhanvien: nv
    });
});

// GET: Thêm phòng ban
router.get('/them', async (req, res) => {
    var nv = await NhanVien.find().populate('PhongBanId').populate('ChucVuId').exec();
    res.render('PhongBan/phongban_them', {
        title: 'Thêm phòng ban',
        nhanvien: nv
    });
});
// POST: Thêm phòng ban
router.post('/them', async (req, res) => {
    var data = {
            TenPhongBan: req.body.TenPhongBan,
            MoTa: req.body.MoTa,
            TruongPhongId: req.body.TruongPhongId || null // ID của nhân viên được chọn từ Select
        };
    await PhongBan.create(data);
    res.redirect('/phongban?info=succsess');
});
// GET: Sửa phòng ban
router.get('/sua/:id', async (req, res) => {
    var id = req.params.id;
        var pb = await PhongBan.findById(id);
        // Lấy toàn bộ nhân viên để chọn 1 người làm Trưởng phòng
        var nv = await NhanVien.find().populate('PhongBanId').populate('ChucVuId').exec();

        res.render('PhongBan/phongban_sua', {
            title: 'Sửa phòng ban',
            phongban: pb,
            nhanvien: nv // Gửi danh sách nhân viên sang để làm Dropdown
        });
});
// POST: Sửa phòng ban
router.post('/sua/:id', async (req, res) => {
    var id = req.params.id;
    var truongPhongMoiId = req.body.TruongPhongId;

    // Logic: Kiểm tra xem người này có đang là trưởng phòng của phòng ban KHÁC không
    if (truongPhongMoiId) {
        var pbCu = await PhongBan.findOne({ 
            TruongPhongId: truongPhongMoiId, 
            _id: { $ne: id } 
        }).exec();

        // Nếu nhân viên này đang làm trưởng phòng ở nơi khác, thì xóa chức vụ ở nơi đó
        if (pbCu) {
            await PhongBan.findByIdAndUpdate(pbCu._id, { TruongPhongId: null }).exec();
        }
    }

    var data = {
        TenPhongBan: req.body.TenPhongBan,
        MoTa: req.body.MoTa,
        TruongPhongId: truongPhongMoiId || null
    };

    await PhongBan.findByIdAndUpdate(id, data).exec();
    res.redirect('/phongban?info=succsess');
});

// GET: Xóa phòng ban
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;
    // Kiểm tra phòng ban này còn nhân viên trực thuộc hay không???
    var checkNV = await NhanVien.findOne({ PhongBanId: id });

    if (checkNV) {
        var pb = await PhongBan.find();
        return res.render('PhongBan/phongban', {
            title: 'Danh sách phòng ban',
            phongban: pb,
            info: "Phòng ban này đang có nhân viên, hãy chuyển họ đi trước khi xóa!"
        });
    }
    await PhongBan.findByIdAndDelete(id);
    res.redirect('/phongban');
});
module.exports = router;