import fs from 'fs';
import path from 'path';
import { mkdirp } from 'mkdirp';

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'files');



function customFileSystem() {
  return {
    async write(filePath, { stream, client }) {
      const fullPath = path.join(ROOT_DIR, filePath);
      const dir = path.dirname(fullPath);
      console.log(`[INFO] Đang ghi file: ${fullPath} từ client: ${client.ip}`);

      // Tạo thư mục nếu cần
      await mkdirp(dir);

      // Tạo stream ghi file
      const writeStream = fs.createWriteStream(fullPath);

      // Pipe dữ liệu vào file
      stream.pipe(writeStream);

      // ✅ Bắt log khi ghi xong (dùng writeStream, không phải stream)
      writeStream.on('finish', () => {
        console.log(`[OK] File đã lưu tại: ${fullPath}`);
      });

      // Bắt lỗi
      writeStream.on('error', (err) => {
        console.error('Lỗi khi ghi file:', err);
      });

      return Promise.resolve();
    },

    async mkdir(pathname) {
      const fullPath = path.join(ROOT_DIR, pathname);
      await mkdirp(fullPath);
    },

    async stat(pathname) {
      const fullPath = path.join(ROOT_DIR, pathname);
      try {
        return fs.statSync(fullPath);
      } catch {
        return null;
      }
    },

    // ✅ hỗ trợ LIST thư mục
    async readdir(pathname) {
      const fullPath = path.join(ROOT_DIR, pathname);
      try {
        return fs.readdirSync(fullPath);
      } catch (err) {
        return [];
      }
    },

    // ✅ hỗ trợ lệnh PWD
    async currentDirectory() {
      return '/';
    },

    // ✅ hỗ trợ đổi thư mục (CD)
    async chdir(pathname) {
      return pathname;
    }
  };
}

export default customFileSystem;