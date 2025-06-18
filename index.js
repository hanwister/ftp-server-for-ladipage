// server.mjs (nên đặt tên file là .mjs hoặc thêm "type": "module" vào package.json)

import FtpSrv from 'ftp-srv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // Để xử lý __dirname trong ES Modules
import bunyan from 'bunyan'; // Import bunyan

// Thay thế __dirname trong ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 21; // Cổng FTP mặc định
const dataDir = path.join(__dirname, 'uploads'); // Thư mục sẽ lưu trữ file FTP

// Kiểm tra và tạo thư mục dataDir nếu chưa tồn tại
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir);
    console.log(`Thư mục '${dataDir}' đã được tạo.`);
}

const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${port}`, // Lắng nghe trên tất cả các interface IP
    pasv_url: '103.173.228.35', // Địa chỉ IP để client kết nối PASV, thay đổi nếu server của bạn có IP công cộng
    anonymous: true, // Cho phép người dùng ẩn danh (không cần username/password)
    log: bunyan.createLogger({ name: 'ftp-server', level: 'info' }) // Sử dụng bunyan đã import
});

// Sự kiện khi một client kết nối
ftpServer.on('client-connected', (data) => {
    console.log(`Client kết nối: ${data.connection.ip}`);
});

// Cấu hình xác thực (authentication)
ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
    console.log(`Người dùng ${username || 'anonymous'} đang cố gắng đăng nhập từ ${connection.ip}`);
    resolve({ root: dataDir });
});

ftpServer.on('MKD', async (error, filePath) => {
    console.log(`Yêu cầu tạo thư mục: ${filePath}`);
    // filePath là đường dẫn tương đối từ thư mục gốc của người dùng FTP
    // Ví dụ: nếu root là /home/ftpuser và client muốn tạo /new/folder
    // thì filePath sẽ là /new/folder

    // Lấy thư mục gốc đã được thiết lập cho người dùng (từ sự kiện 'login')
    const userRoot = ftpServer.options.root; // Hoặc lấy từ session nếu bạn có nhiều user

    // Tạo đường dẫn tuyệt đối trên hệ thống file server
    const absolutePath = path.join(userRoot || dataDir, filePath); // Sử dụng dataDir làm fallback

    console.log(`Yêu cầu tạo thư mục: ${absolutePath}`); // Log đúng rồi

    try {
        // Sử dụng fs.mkdirSync với recursive: true để tạo tất cả các thư mục cha nếu chúng chưa tồn tại
        fs.mkdirSync(absolutePath, { recursive: true });
        // Nếu thành công, không gọi error() mà trả về thông báo thành công
        console.log(`Đã tạo thư mục thành công: ${absolutePath}`); // Sửa lại log cho rõ ràng
        // TRẢ VỀ PHẢN HỒI FTP CHUẨN XÁC: 257 với đường dẫn được tạo
        return `257 "${filePath}" created.`; // **ĐÃ SỬA: Bỏ KWD và dùng chuỗi phản hồi chuẩn**
    } catch (err) {
        console.error(`Lỗi khi tạo thư mục ${absolutePath}:`, err.message);
        // Trả về lỗi cho client FTP
        // FTP error codes: 550 for file/directory not available
        return `550 Directory creation failed: ${err.message}`; // Giữ nguyên phản hồi lỗi
    }
});

// Bắt đầu server
ftpServer.listen()
    .then(() => {
        console.log(`FTP Server đang chạy trên cổng ${port}`);
        console.log(`Thư mục dữ liệu: ${dataDir}`);
        console.log('Bạn có thể kết nối bằng FTP client (ví dụ: FileZilla) hoặc trình duyệt (ftp://localhost:21)');
    })
    .catch(err => {
        console.error('Không thể khởi động FTP server:', err);
    });

// Xử lý khi server bị đóng
process.on('SIGTERM', () => {
    console.log('Đang đóng FTP server...');
    ftpServer.close();
});