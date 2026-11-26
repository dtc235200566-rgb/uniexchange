const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { AppError } = require('../utils/errors');

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit per report spec
const MAX_FILES_COUNT = 5;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_COUNT,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError(400, 'Chỉ chấp nhận tệp ảnh định dạng JPG, PNG, WEBP hoặc GIF.'));
    }
    return cb(null, true);
  },
});

module.exports = {
  upload,
  uploadDir,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_COUNT,
};
