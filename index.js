import FtpSrv from "ftp-srv";
import fs from "fs";
import { mkdirp } from "mkdirp";
import path from "path";
import { fileURLToPath } from "url";
import customFileSystem from "./src/customFileSystem.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Địa chỉ và port server FTP
const ftpServer = new FtpSrv({
  url: "ftp://0.0.0.0:21",
  pasv_url: "127.0.0.1", // dùng IP thật nếu dùng public
  anonymous: false
});

console.log(__dirname)

// Thư mục lưu file
const ROOT_DIR = path.resolve(__dirname, 'uploads');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(ROOT_DIR)) {
  fs.mkdirSync(ROOT_DIR);
}

// Xác thực user đăng nhập
ftpServer.on('login', ({ username, password }, resolve, reject) => {
  if (username === 'user' && password === 'pass') {
    resolve({ root: ROOT_DIR, fs: customFileSystem() });
  } else {
    reject(new Error('Sai thông tin đăng nhập'));
  }
});

// Log khi có kết nối
ftpServer.on('client-connected', (client) => {
  console.log('Client connected:', client.ip);
});

ftpServer.listen()
  .then(() => {
    console.log('FTP server đang chạy tại ftp://localhost:21');
    console.log('Đăng nhập với user: user / pass: pass');
  })
  .catch(err => {
    console.error('Lỗi khởi động server:', err);
  });
