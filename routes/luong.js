var express = require('express');
var router = express.Router();
var Luong = require('../models/luong');
var NhanVien = require('../models/nhanvien');
var ChamCong = require('../models/chamcong');
var ThuongPhat = require('../models/thuongphat');
// GET: Danh sách lương (Lọc bảng lương theo tháng năm)
router.get('/', async (req, res) => {
    var thang = req.query.thang || new Date().getMonth() + 1;
    var nam = req.query.nam || new Date().getFullYear();

    var dsLuong = await Luong.find({ Thang: thang, Nam: nam }).populate('NhanVien').sort({ NhanVien: 1}).exec();
    
    res.render('Luong/luong', {
        title: 'Bảng lương tháng ' + thang + '/' + nam,
        luong: dsLuong,
        thang: thang,
        nam: nam
    });
});
// POST: Tính lương hàng loạt (Cách viết tường minh như Phòng Ban)
router.post('/tinh-luong', async (req, res) => {
    var thang = parseInt(req.body.thang);
    var nam = parseInt(req.body.nam);
    // Lấy danh sách nhân viên để bắt đầu tính toán
    var dsNV = await NhanVien.find({ TrangThai: 'Đang làm việc' }).populate('ChucVuId');
    // Duyệt qua từng nhân viên để tính
    for (var i = 0; i < dsNV.length; i++) 
    {
        var nv = dsNV[i];   
        // Thiết lập khoảng thời gian của tháng cần tính
        var dauThang = new Date(nam, thang - 1, 1);
        var cuoiThang = new Date(nam, thang, 0, 23, 59, 59);
        // Tính số ngày công trong tháng
        var soNgayCong = await ChamCong.countDocuments({NhanVienId: nv._id, 
                                                        NgayChamCong: { $gte: dauThang, $lte: cuoiThang },
                                                        GioVao: { $exists: true, $ne: null }
        });
        var soLanMuon = await ChamCong.countDocuments({
            NhanVienId: nv._id,
            NgayChamCong: { $gte: dauThang, $lte: cuoiThang },
            TrangThai: { $regex: 'Muộn', $options: 'i' } // Tìm bất cứ trạng thái nào có chữ "Muộn"
        });
        var heSoLuong = await nv.HeSoLuong;
        var ngayCongChuan = 26;
        // Tính Thưởng/Phạt
        var dsTP = await ThuongPhat.find({
            NhanVienId: nv._id,
            NgayQuyetDinh: { $gte: dauThang, $lte: cuoiThang }
        });

        var tongThuong = 0;
        var tongPhat = 0;
        dsTP.forEach(tp => {
            if (tp.Loai === 'Khen thưởng') tongThuong += tp.SoTien;
            else tongPhat += tp.SoTien;
        });

        var luongCB = nv.ChucVuId ? nv.ChucVuId.LuongCoBan : 0;
        var phuCap = nv.ChucVuId ? nv.ChucVuId.PhuCap : 0;        
        if (soNgayCong <= 20)  phuCap = 0;      // Quy định điều kiện với phụ cấp
            
        var thanhTien = (((luongCB * heSoLuong) * soNgayCong)/ngayCongChuan) + phuCap + tongThuong - tongPhat;
        thanhTien = Math.floor(thanhTien);
        var data = {
            NhanVien: nv._id,
            Thang: thang,
            Nam: nam,
            SoNgayCong: soNgayCong,
            SoLanMuon: soLanMuon,
            HeSoLuong: 1,
            TongLuong: thanhTien,
            GhiChu: "Thưởng: " + tongThuong.toLocaleString('vi-VN') + "vnđ - Phạt: " + tongPhat.toLocaleString('vi-VN') + " vnđ"
        };

        // Lưu vào DB (Nếu đã có thì cập nhật, chưa có thì tạo mới)
        await Luong.findOneAndUpdate(
            { NhanVien: nv._id, Thang: thang, Nam: nam },
            data,
            { upsert: true }
        );
    }
    res.redirect('/luong?thang=' + thang + '&nam=' + nam);
});
// GET: Xóa lương
router.get('/xoa/:id', async (req, res) => {
    var id = req.params.id;
    await Luong.findByIdAndDelete(id);
    res.redirect('/luong');
});

module.exports = router;