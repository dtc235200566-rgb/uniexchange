const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');
const { ALLOWED_REPORT_STATUSES } = require('../utils/validators');

const router = express.Router();

// POST /api/reports - Submit a violation report
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const postId = req.body.post_id || req.body.listing_id;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';

    if (!postId || !reason || reason.length < 5) {
      throw new AppError(400, 'Vui lòng nhập lý do báo cáo (tối thiểu 5 ký tự).');
    }

    const postExists = await db.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postExists.rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tin đăng bị báo cáo.');
    }

    const { rows } = await db.query(
      `INSERT INTO reports (post_id, reporter_id, reason)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, req.user.id, reason]
    );

    res.status(201).json({
      message: 'Đã gửi báo cáo vi phạm đến quản trị viên.',
      report: rows[0],
    });
  })
);

// GET /api/reports - Admin list of violation reports
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT r.*, p.title AS post_title, p.status AS post_status, p.user_id AS post_owner_id,
              reporter.fullname AS reporter_name, reporter.email AS reporter_email,
              owner.fullname AS owner_name, owner.email AS owner_email
       FROM reports r
       JOIN posts p ON p.id = r.post_id
       JOIN users reporter ON reporter.id = r.reporter_id
       JOIN users owner ON owner.id = p.user_id
       ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC`
    );

    res.status(200).json({ reports: rows });
  })
);

// PATCH /api/reports/:id - Admin resolve/dismiss report (and optionally hide/delete post)
router.patch(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
    const action = req.body.action; // 'hide_post' | 'delete_post' | undefined

    if (!ALLOWED_REPORT_STATUSES.includes(status)) {
      throw new AppError(400, 'Trạng thái xử lý báo cáo không hợp lệ.');
    }

    const { rows } = await db.query(
      'UPDATE reports SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy báo cáo.');
    }

    const report = rows[0];
    if (action === 'hide_post') {
      await db.query("UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = $1", [
        report.post_id,
      ]);
    } else if (action === 'delete_post') {
      await db.query('DELETE FROM posts WHERE id = $1', [report.post_id]);
    }

    res.status(200).json({ message: 'Đã cập nhật trạng thái xử lý báo cáo.', report });
  })
);

module.exports = router;
