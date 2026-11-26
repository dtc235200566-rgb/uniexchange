const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');
const { slugify } = require('../utils/validators');

const router = express.Router();

// GET /api/categories
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT c.id, c.name, c.slug, c.description,
              COUNT(p.id) FILTER (WHERE p.status = 'available')::int AS active_posts_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );
    res.status(200).json({ categories: rows });
  })
);

// POST /api/categories (Admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const slug = slugify(req.body.slug || name);

    if (!name || !slug) {
      throw new AppError(400, 'Tên danh mục không được để trống.');
    }

    const exists = await db.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (exists.rows.length > 0) {
      throw new AppError(409, 'Danh mục với đường dẫn (slug) này đã tồn tại.');
    }

    const { rows } = await db.query(
      'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) RETURNING *',
      [name, slug, description]
    );

    res.status(201).json({ category: rows[0] });
  })
);

// PUT /api/categories/:id (Admin only)
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, 'ID danh mục không hợp lệ.');
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!name) {
      throw new AppError(400, 'Tên danh mục không được để trống.');
    }

    const slug = slugify(req.body.slug || name);
    const { rows } = await db.query(
      'UPDATE categories SET name = $1, slug = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, slug, description, id]
    );

    if (rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy danh mục.');
    }

    res.status(200).json({ category: rows[0] });
  })
);

// DELETE /api/categories/:id (Admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(400, 'ID danh mục không hợp lệ.');
    }

    const postsCount = await db.query(
      'SELECT COUNT(*)::int AS count FROM posts WHERE category_id = $1',
      [id]
    );
    if (postsCount.rows[0].count > 0) {
      throw new AppError(409, 'Không thể xóa danh mục đang có tin đăng.');
    }

    const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);
    if (rowCount === 0) {
      throw new AppError(404, 'Không tìm thấy danh mục.');
    }

    res.status(200).json({ message: 'Đã xóa danh mục.' });
  })
);

module.exports = router;
