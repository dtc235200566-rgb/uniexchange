const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const SAMPLE_LISTINGS = [
  {
    title: 'Giáo trình Giải tích 1 - Còn mới 95%',
    description: 'Sách học kỳ trước, không rách trang, có ghi chú công thức ôn thi cuối kỳ rất rõ ràng. Phù hợp cho sinh viên năm nhất ICTU.',
    price: 35000,
    condition: 'Mới 95%',
    type: 'sell',
    categorySlug: 'giao-trinh',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80'],
  },
  {
    title: 'Giáo trình Nhập môn Điện toán đám mây',
    description: 'Tài liệu tham khảo môn Điện toán đám mây, bản in đẹp, sạch sẽ. Nhượng lại giá rẻ cho các bạn khóa dưới.',
    price: 45000,
    condition: 'Còn tốt',
    type: 'sell',
    categorySlug: 'giao-trinh',
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80'],
  },
  {
    title: 'Máy tính Casio fx-580VN X chính hãng',
    description: 'Máy dùng kỹ, phím bấm nảy tốt, màn hình rõ nét, còn nắp trượt bảo vệ. Bao test trực tiếp tại sân trường.',
    price: 320000,
    condition: 'Còn tốt',
    type: 'sell',
    categorySlug: 'do-dien-tu',
    images: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80'],
  },
  {
    title: 'Đèn bàn học chống cận gập gọn',
    description: 'Đèn LED 3 chế độ ánh sáng, có cổng sạc USB tiện lợi cho bàn học ký túc xá.',
    price: 85000,
    condition: 'Mới 90%',
    type: 'sell',
    categorySlug: 'noi-that',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80'],
  },
  {
    title: 'Bộ vở ghi chép và thước kỹ thuật (Tặng miễn phí)',
    description: 'Mình dọn phòng trọ còn dư 5 quyển vở mới chưa dùng và bộ thước kẻ, tặng lại bạn nào cần nhé.',
    price: 0,
    condition: 'Mới 100%',
    type: 'giveaway',
    categorySlug: 'khac',
    images: ['https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80'],
  },
  {
    title: 'Bàn phím cơ không dây 75% (Nhận trao đổi)',
    description: 'Switch red gõ êm, phù hợp mang lên thư viện hoặc code đêm. Có thể bán hoặc đổi lấy màn hình phụ.',
    price: 490000,
    condition: 'Còn tốt',
    type: 'exchange',
    categorySlug: 'do-dien-tu',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'],
  },
];

/**
 * Initialize database schema, default categories, and optional demo records.
 * Safe to call repeatedly on server startup.
 */
async function initializeDatabase() {
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);

  const seedSql = fs.readFileSync(seedPath, 'utf8');
  await db.query(seedSql);

  if (process.env.SEED_DEMO_DATA !== 'true') {
    return;
  }

  const { rows: existingPosts } = await db.query('SELECT COUNT(*)::int AS count FROM posts');
  if (existingPosts[0].count > 0) {
    return;
  }

  const studentHash = await bcrypt.hash('123456', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);

  const studentRes = await db.query(
    `INSERT INTO users (fullname, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'user')
     ON CONFLICT (email) DO UPDATE SET fullname = EXCLUDED.fullname
     RETURNING id`,
    ['Đàm Long Nhật', 'sinhvien@ictu.edu.vn', studentHash, '0987654321']
  );

  await db.query(
    `INSERT INTO users (fullname, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['Quản trị viên UniExchange', 'admin@ictu.edu.vn', adminHash, '0912345678']
  );

  const studentId = studentRes.rows[0].id;
  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  for (const item of SAMPLE_LISTINGS) {
    const categoryId = categoryMap.get(item.categorySlug) || categories[0]?.id;
    if (!categoryId) continue;

    const postRes = await db.query(
      `INSERT INTO posts (user_id, category_id, title, description, price, condition, type, status, images_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', $8::jsonb)
       RETURNING id`,
      [
        studentId,
        categoryId,
        item.title,
        item.description,
        item.price,
        item.condition,
        item.type,
        JSON.stringify(item.images),
      ]
    );

    const postId = postRes.rows[0].id;
    for (let i = 0; i < item.images.length; i += 1) {
      await db.query(
        'INSERT INTO listing_images (listing_id, image_url, display_order) VALUES ($1, $2, $3)',
        [postId, item.images[i], i]
      );
    }
  }
}

module.exports = { initializeDatabase };
