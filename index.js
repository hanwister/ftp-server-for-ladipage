import FtpSrv from "ftp-srv";
import fs from "fs";
import { mkdirp } from "mkdirp";
import path from "path";
import { fileURLToPath } from "url";

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

function customFileSystem() {
  return {
    async write(filePath, { stream, client }) {
      const fullPath = path.join(ROOT_DIR, filePath);
      const dir = path.dirname(fullPath);

      // ✅ Tạo thư mục nếu chưa có
      await mkdirp(dir);

      // ✅ Ghi file như cũ (hoặc xử lý gì đó)
      const writeStream = fs.createWriteStream(fullPath);
      stream.pipe(writeStream);

      stream.on('end', () => {
        console.log(`[OK] File đã lưu tại: ${fullPath}`);
      });

      stream.on('error', (err) => {
        console.error('Lỗi khi ghi file:', err);
        writeStream.destroy();
      });

      return Promise.resolve(); // báo là đã xử lý xong
    },

    // Thêm hỗ trợ tạo thư mục
    async mkdir(pathname) {
      const fullPath = path.join(ROOT_DIR, pathname);
      await mkdirp(fullPath);
    },

    // Thêm kiểm tra thư mục tồn tại (FileZilla sẽ dùng)
    async stat(pathname) {
      const fullPath = path.join(ROOT_DIR, pathname);
      try {
        const stats = fs.statSync(fullPath);
        return stats;
      } catch {
        return null;
      }
    }
  };
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
