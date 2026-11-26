const express = require('express');
const db = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { AppError, asyncHandler } = require('../utils/errors');
const { validatePostInput, ALLOWED_STATUSES } = require('../utils/validators');

const router = express.Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidUuid(id) {
  if (!UUID_REGEX.test(String(id || ''))) {
    throw new AppError(400, 'Mã tin đăng không hợp lệ.');
  }
}

/**
 * Normalize image list from uploaded files + body.images / body.existing_images.
 */
function resolveImagesFromRequest(req) {
  const uploadedUrls = Array.isArray(req.files)
    ? req.files.map((file) => `/uploads/${file.filename}`)
    : [];

  let bodyImages = [];
  const raw = req.body.images ?? req.body.existing_images ?? req.body.images_url;
  if (Array.isArray(raw)) {
    bodyImages = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      bodyImages = Array.isArray(parsed) ? parsed : [raw];
    } catch {
      bodyImages = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const combined = [...bodyImages, ...uploadedUrls]
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter(Boolean);

  return Array.from(new Set(combined)).slice(0, 5);
}

/**
 * Replace listing_images rows for a post within an active DB client transaction.
 */
async function syncListingImages(client, postId, imageUrls) {
  await client.query('DELETE FROM listing_images WHERE listing_id = $1', [postId]);
  for (let i = 0; i < imageUrls.length; i += 1) {
    await client.query(
      'INSERT INTO listing_images (listing_id, image_url, display_order) VALUES ($1, $2, $3)',
      [postId, imageUrls[i], i]
    );
  }
}

function formatPostRow(row, { includeContact = false } = {}) {
  const images = Array.isArray(row.images_url) ? row.images_url : [];
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    condition: row.condition,
    type: row.type,
    status: row.status,
    images,
    images_url: images,
    created_at: row.created_at,
    updated_at: row.updated_at,
    seller: {
      id: row.user_id,
      fullname: row.seller_fullname,
      created_at: row.seller_created_at,
      phone: includeContact ? row.seller_phone || '' : null,
      email: includeContact ? row.seller_email : null,
      contact_hidden: !includeContact,
    },
  };
}

// GET /api/posts (also /api/listings) - Public list with pagination & filters
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const conditions = ["p.status <> 'hidden'"];
    const params = [];

    if (req.query.status && ALLOWED_STATUSES.includes(req.query.status) && req.query.status !== 'hidden') {
      params.push(req.query.status);
      conditions.push(`p.status = $${params.length}`);
    } else if (!req.query.includeSold) {
      // Show available and sold by default unless filtered; keep available prioritized or selectable
    }

    if (req.query.search && String(req.query.search).trim()) {
      params.push(`%${String(req.query.search).trim()}%`);
      conditions.push(`(p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
    }

    if (req.query.category && String(req.query.category).trim() && req.query.category !== 'all') {
      const catVal = String(req.query.category).trim();
      if (/^\d+$/.test(catVal)) {
        params.push(Number(catVal));
        conditions.push(`p.category_id = $${params.length}`);
      } else {
        params.push(catVal);
        conditions.push(`c.slug = $${params.length}`);
      }
    }

    if (req.query.type && req.query.type !== 'all') {
      params.push(String(req.query.type).trim());
      conditions.push(`p.type = $${params.length}`);
    }

    if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
      const minPrice = Number(req.query.minPrice);
      if (Number.isFinite(minPrice) && minPrice >= 0) {
        params.push(minPrice);
        conditions.push(`p.price >= $${params.length}`);
      }
    }

    if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
      const maxPrice = Number(req.query.maxPrice);
      if (Number.isFinite(maxPrice) && maxPrice >= 0) {
        params.push(maxPrice);
        conditions.push(`p.price <= $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (req.query.sort === 'price_asc') orderBy = 'p.price ASC, p.created_at DESC';
    if (req.query.sort === 'price_desc') orderBy = 'p.price DESC, p.created_at DESC';

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM posts p
      JOIN categories c ON c.id = p.category_id
      ${whereClause}
    `;
    const countRes = await db.query(countQuery, params);
    const total = countRes.rows[0].total;

    const listParams = [...params, limit, offset];
    const listQuery = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             u.fullname AS seller_fullname, u.created_at AS seller_created_at
      FROM posts p
      JOIN categories c ON c.id = p.category_id
      JOIN users u ON u.id = p.user_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
    `;

    const { rows } = await db.query(listQuery, listParams);
    const items = rows.map((row) => formatPostRow(row, { includeContact: false }));

    res.status(200).json({
      items,
      posts: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  })
);

// GET /api/posts/my - Current user's posts for Dashboard
router.get(
  '/my',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              u.fullname AS seller_fullname, u.phone AS seller_phone,
              u.email AS seller_email, u.created_at AS seller_created_at
       FROM posts p
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const items = rows.map((row) => formatPostRow(row, { includeContact: true }));
    res.status(200).json({ items, posts: items });
  })
);

// GET /api/posts/:id - Post detail (contact info visible only when authenticated)
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req, res) => {
    assertValidUuid(req.params.id);

    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              u.fullname AS seller_fullname, u.phone AS seller_phone,
              u.email AS seller_email, u.created_at AS seller_created_at
       FROM posts p
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tin đăng.');
    }

    const row = rows[0];
    const isOwnerOrAdmin = req.user && (req.user.id === row.user_id || req.user.role === 'admin');
    if (row.status === 'hidden' && !isOwnerOrAdmin) {
      throw new AppError(404, 'Tin đăng này hiện đang bị ẩn.');
    }

    const { rows: imageRows } = await db.query(
      'SELECT image_url FROM listing_images WHERE listing_id = $1 ORDER BY display_order ASC',
      [row.id]
    );
    if (imageRows.length > 0) {
      row.images_url = imageRows.map((img) => img.image_url);
    }

    const post = formatPostRow(row, { includeContact: Boolean(req.user) });
    res.status(200).json({ post, listing: post });
  })
);

// POST /api/posts - Create new listing (Protected)
router.post(
  '/',
  authenticateToken,
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    const { errors, data } = validatePostInput(req.body, { partial: false });
    if (Object.keys(errors).length > 0) {
      throw new AppError(400, 'Thông tin đăng bán chưa hợp lệ.', errors);
    }

    const catCheck = await db.query('SELECT id FROM categories WHERE id = $1', [data.category_id]);
    if (catCheck.rows.length === 0) {
      throw new AppError(400, 'Danh mục không tồn tại.');
    }

    const images = resolveImagesFromRequest(req);
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const insertRes = await client.query(
        `INSERT INTO posts (user_id, category_id, title, description, price, condition, type, status, images_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', $8::jsonb)
         RETURNING id`,
        [
          req.user.id,
          data.category_id,
          data.title,
          data.description,
          data.price,
          data.condition,
          data.type,
          JSON.stringify(images),
        ]
      );

      const postId = insertRes.rows[0].id;
      await syncListingImages(client, postId, images);
      await client.query('COMMIT');

      res.status(201).json({
        message: 'Đăng tin thành công.',
        id: postId,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// PUT /api/posts/:id - Update listing (Protected + Ownership check)
router.put(
  '/:id',
  authenticateToken,
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    assertValidUuid(req.params.id);

    const existingRes = await db.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tin đăng.');
    }

    const existing = existingRes.rows[0];
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError(403, 'Bạn không có quyền chỉnh sửa tin đăng của người khác.');
    }

    const { errors, data } = validatePostInput(req.body, { partial: true });
    if (Object.keys(errors).length > 0) {
      throw new AppError(400, 'Dữ liệu cập nhật không hợp lệ.', errors);
    }

    if (data.category_id) {
      const catCheck = await db.query('SELECT id FROM categories WHERE id = $1', [data.category_id]);
      if (catCheck.rows.length === 0) {
        throw new AppError(400, 'Danh mục không tồn tại.');
      }
    }

    const hasImageUpdate =
      (Array.isArray(req.files) && req.files.length > 0) ||
      req.body.images !== undefined ||
      req.body.existing_images !== undefined ||
      req.body.images_url !== undefined;

    const nextImages = hasImageUpdate
      ? resolveImagesFromRequest(req)
      : existing.images_url || [];

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE posts
         SET title = $1,
             description = $2,
             price = $3,
             category_id = $4,
             condition = $5,
             type = $6,
             status = $7,
             images_url = $8::jsonb,
             updated_at = NOW()
         WHERE id = $9`,
        [
          data.title ?? existing.title,
          data.description ?? existing.description,
          data.price ?? existing.price,
          data.category_id ?? existing.category_id,
          data.condition ?? existing.condition,
          data.type ?? existing.type,
          data.status ?? existing.status,
          JSON.stringify(nextImages),
          req.params.id,
        ]
      );

      if (hasImageUpdate) {
        await syncListingImages(client, req.params.id, nextImages);
      }
      await client.query('COMMIT');

      res.status(200).json({ message: 'Cập nhật tin đăng thành công.', id: req.params.id });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// PATCH /api/posts/:id/status - Quick status change (Mark as Sold / Available / Hidden)
router.patch(
  '/:id/status',
  authenticateToken,
  asyncHandler(async (req, res) => {
    assertValidUuid(req.params.id);

    const status = typeof req.body.status === 'string' ? req.body.status.trim() : '';
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new AppError(400, 'Trạng thái không hợp lệ (available, sold, hidden).');
    }

    const existingRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tin đăng.');
    }

    if (existingRes.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      throw new AppError(403, 'Bạn không có quyền thay đổi trạng thái tin của người khác.');
    }

    await db.query('UPDATE posts SET status = $1, updated_at = NOW() WHERE id = $2', [
      status,
      req.params.id,
    ]);

    res.status(200).json({ message: 'Đã cập nhật trạng thái tin đăng.', status });
  })
);

// DELETE /api/posts/:id - Delete listing (Owner or Admin only -> 403 IDOR protection)
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    assertValidUuid(req.params.id);

    const existingRes = await db.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    if (existingRes.rows.length === 0) {
      throw new AppError(404, 'Không tìm thấy tin đăng.');
    }

    const ownerId = existingRes.rows[0].user_id;
    if (ownerId !== req.user.id && req.user.role !== 'admin') {
      throw new AppError(403, 'Forbidden: Bạn không có quyền xóa bài đăng của người khác.');
    }

    await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Đã xóa tin đăng.' });
  })
);

module.exports = router;
