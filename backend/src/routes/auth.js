const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken, getJwtSecret } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');
const { isValidEmail, isValidPhone } = require('../utils/validators');

const router = express.Router();

function sanitizeUser(row) {
  return {
    id: row.id,
    fullname: row.fullname,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    created_at: row.created_at,
  };
}

function signUserToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullname: user.fullname },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const fullname = typeof req.body.fullname === 'string'
      ? req.body.fullname.trim()
      : typeof req.body.full_name === 'string'
        ? req.body.full_name.trim()
        : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const phone = req.body.phone ?? req.body.phone_number ?? '';

    const errors = {};
    if (!fullname || fullname.length < 2) {
      errors.fullname = 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (!isValidEmail(email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }
    if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (!isValidPhone(phone)) {
      errors.phone = 'Số điện thoại không hợp lệ (8-15 chữ số).';
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError(400, 'Dữ liệu đăng ký không hợp lệ.', errors);
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError(409, 'Email này đã được đăng ký tài khoản.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      `INSERT INTO users (fullname, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, fullname, email, phone, role, created_at`,
      [fullname, email, passwordHash, String(phone || '').trim() || null]
    );

    const user = sanitizeUser(rows[0]);
    const token = signUserToken(user);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      token,
      user,
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!isValidEmail(email) || !password) {
      throw new AppError(400, 'Vui lòng nhập đầy đủ email và mật khẩu hợp lệ.');
    }

    const { rows } = await db.query(
      'SELECT id, fullname, email, password_hash, phone, role, created_at FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      throw new AppError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      throw new AppError(401, 'Email hoặc mật khẩu không chính xác.');
    }

    const user = sanitizeUser(userRow);
    const token = signUserToken(user);

    res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user,
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      'SELECT id, fullname, email, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tài khoản.');
    }

    res.status(200).json({ user: sanitizeUser(rows[0]) });
  })
);

module.exports = router;
