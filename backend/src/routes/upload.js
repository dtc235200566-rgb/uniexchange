const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { AppError } = require('../utils/errors');

const router = express.Router();

// POST /api/upload - Upload up to 5 images (< 5MB each)
router.post('/', authenticateToken, upload.array('images', 5), (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError(400, 'Vui lòng chọn ít nhất một tệp ảnh để tải lên.'));
  }

  const urls = req.files.map((file) => `/uploads/${file.filename}`);
  return res.status(201).json({
    message: 'Tải ảnh lên thành công.',
    images: urls,
  });
});

module.exports = router;
