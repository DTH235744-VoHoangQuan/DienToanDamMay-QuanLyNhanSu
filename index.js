var http = require('http');

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var session = require('express-session');
var path = require('path');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var chamcongRouter = require('./routes/chamcong');
var chucvuRoute = require('./routes/chucvu');
var donnghiphepRoute = require('./routes/donnghiphep');
var luongRouter = require('./routes/luong');
var nhanvienRouter = require('./routes/nhanvien');
var phongbanRouter = require('./routes/phongban');
var thuongphatRouter = require('./routes/thuongphat');
var dashboardRouter = require('./routes/dashboard');

var uri = 'mongodb://quan_user:admin123@ac-jwgbwx8-shard-00-01.scmq4tq.mongodb.net:27017/quanlynhansu?ssl=true&authSource=admin';
mongoose.connect(uri)
    .then(() => console.log("Đã kết nối thành công tới MongoDB."))
    .catch(err => console.log(err));

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'public')));

app.use(session({
    name: 'HR-Cloud', // Tên session (tự chọn)
    secret: 'Mèo méo meo mèo meo', // Khóa bảo vệ (tự chọn)
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000 // Hết hạn sau 30 ngày
    }
}));
app.use((req, res, next) => {
    // Chuyển biến session thành biến cục bộ
    res.locals.session = req.session;
    // Lấy thông báo (lỗi, thành công) của trang trước đó (nếu có)
    var err = req.session.error;
    var msg = req.session.success;
    // Xóa session sau khi đã truyền qua biến trung gian
    delete req.session.error;
    delete req.session.success;
    // Gán thông báo (lỗi, thành công) vào biến cục bộ
    res.locals.message = '';
    if (err) res.locals.message = '<span class="text-danger">' + err + '</span>';
    if (msg) res.locals.message = '<span class="text-success">' + msg + '</span>';
    next();
});

app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/chamcong', chamcongRouter);
app.use('/chucvu', chucvuRoute);
app.use('/donnghiphep', donnghiphepRoute);
app.use('/luong', luongRouter);
app.use('/nhanvien', nhanvienRouter);
app.use('/phongban', phongbanRouter);
app.use('/thuongphat', thuongphatRouter);
app.use('/dashboard', dashboardRouter);

app.get('/', (req, res) => {
    res.render('index', { title: 'TRANG CHỦ' });
});
app.listen(3000, () => { console.log('Server is running at https://dientoandammay-quanlynhansu.onrender.com') });