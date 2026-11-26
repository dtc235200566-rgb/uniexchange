const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const SAMPLE_LISTINGS = [
  {
    title: 'Giáo trình Giải tích 1 - Còn mới 95%',
    description:
      'Sách học kỳ trước, không rách trang, có ghi chú công thức ôn thi cuối kỳ rất rõ ràng. Phù hợp cho sinh viên năm nhất ICTU.',
    price: 35000,
    condition: 'Mới 95%',
    type: 'sell',
    categorySlug: 'giao-trinh',
    sellerKey: 'nhat',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Giáo trình Nhập môn Điện toán đám mây',
    description:
      'Tài liệu tham khảo môn Điện toán đám mây, bản in đẹp, sạch sẽ. Nhượng lại giá rẻ cho các bạn khóa dưới.',
    price: 45000,
    condition: 'Còn tốt',
    type: 'sell',
    categorySlug: 'giao-trinh',
    sellerKey: 'minhanh',
    images: [
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Máy tính Casio fx-580VN X chính hãng',
    description:
      'Máy dùng kỹ, phím bấm nảy tốt, màn hình rõ nét, còn nắp trượt bảo vệ. Bao test trực tiếp tại sân trường.',
    price: 320000,
    condition: 'Còn tốt',
    type: 'sell',
    categorySlug: 'do-dien-tu',
    sellerKey: 'nhat',
    images: [
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Đèn bàn học chống cận gập gọn',
    description: 'Đèn LED 3 chế độ ánh sáng, có cổng sạc USB tiện lợi cho bàn học ký túc xá.',
    price: 85000,
    condition: 'Mới 90%',
    type: 'sell',
    categorySlug: 'noi-that',
    sellerKey: 'minhanh',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Bộ vở ghi chép và thước kỹ thuật (Tặng miễn phí)',
    description:
      'Mình dọn phòng trọ còn dư 5 quyển vở mới chưa dùng và bộ thước kẻ, tặng lại bạn nào cần nhé.',
    price: 0,
    condition: 'Mới 100%',
    type: 'giveaway',
    categorySlug: 'khac',
    sellerKey: 'nhat',
    images: [
      'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Bàn phím cơ không dây 75% (Nhận trao đổi)',
    description:
      'Switch red gõ êm, phù hợp mang lên thư viện hoặc code đêm. Có thể bán hoặc đổi lấy màn hình phụ.',
    price: 490000,
    condition: 'Còn tốt',
    type: 'exchange',
    categorySlug: 'do-dien-tu',
    sellerKey: 'nhat',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
      '/demo-images/gia-do-laptop.jpg',
    ],
  },
  {
    title: 'Bàn học gấp gỗ cho sinh viên phòng trọ',
    description:
      'Bàn học gấp chân sắt chắc chắn, mặt gỗ sạch sẽ không bong tróc, gấp gọn dễ mang chuyển trọ. Giao trực tiếp gần cổng trường ICTU.',
    price: 70000,
    condition: 'Mới 90%',
    type: 'sell',
    categorySlug: 'noi-that',
    sellerKey: 'minhanh',
    images: ['/demo-images/ban-hoc-gap.jpg'],
  },
  {
    title: 'Combo Tai nghe Bluetooth + Chuột không dây (Pass nhanh)',
    description:
      'Tai nghe pin trâu nghe học online/tiếng Anh rất rõ, kèm chuột không dây nhạy. Có nhận đổi sang SSD hoặc USB 64GB.',
    price: 260000,
    condition: 'Còn tốt',
    type: 'exchange',
    categorySlug: 'do-dien-tu',
    sellerKey: 'nhat',
    images: [
      '/demo-images/tai-nghe-chuot.jpg',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Kệ sách mini 4 tầng để bàn ký túc xá',
    description:
      'Kệ gỗ gọn nhẹ đựng vừa giáo trình A4 và đồ dùng cá nhân trên bàn học. Muốn trao đổi lấy ấm siêu tốc hoặc đèn bàn.',
    price: 110000,
    condition: 'Mới 95%',
    type: 'exchange',
    categorySlug: 'noi-that',
    sellerKey: 'minhanh',
    images: ['/demo-images/ke-sach-mini.jpg'],
  },
  {
    title: 'Giá đỡ laptop hợp kim nhôm gập gọn',
    description:
      'Nâng cao màn hình chống mỏi cổ khi ngồi code hoặc làm đồ án, tản nhiệt thoáng mát, kèm túi vải đựng mang đi học.',
    price: 95000,
    condition: 'Mới 95%',
    type: 'sell',
    categorySlug: 'do-dien-tu',
    sellerKey: 'nhat',
    images: [
      '/demo-images/gia-do-laptop.jpg',
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Xe đạp sinh viên đi học quanh trường',
    description:
      'Xe chạy êm, phanh còn ăn tốt, lốp mới thay tháng trước. Sinh viên năm cuối chuẩn bị thực tập nên pass lại giá mềm.',
    price: 850000,
    condition: 'Đã qua sử dụng',
    type: 'sell',
    categorySlug: 'phuong-tien',
    sellerKey: 'minhanh',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Balo laptop 15.6 inch chống nước (Đổi đồ / Pass)',
    description:
      'Balo nhiều ngăn, khóa kéo trơn tru, đựng vừa laptop 15.6 inch và sách vở. Pass lại hoặc đổi giáo trình chuyên ngành CNTT.',
    price: 140000,
    condition: 'Còn tốt',
    type: 'exchange',
    categorySlug: 'khac',
    sellerKey: 'nhat',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    title: 'Mũ bảo hiểm còn mới (Tặng miễn phí bạn khóa dưới)',
    description:
      'Mình dư 1 mũ bảo hiểm sạch sẽ, quai cài chắc chắn, tặng lại cho bạn sinh viên năm nhất đang cần.',
    price: 0,
    condition: 'Mới 90%',
    type: 'giveaway',
    categorySlug: 'phuong-tien',
    sellerKey: 'minhanh',
    images: [
      'https://images.unsplash.com/photo-1494030575520-dd03dd6aeb04?auto=format&fit=crop&w=900&q=80',
    ],
  },
];

/**
 * Initialize database schema, default categories, and optional demo records.
 * Idempotent: safely adds any missing demo accounts or sample listings.
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

  const studentHash = await bcrypt.hash('123456', 10);
  const adminHash = await bcrypt.hash('Admin@123', 10);

  const studentRes = await db.query(
    `INSERT INTO users (fullname, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'user')
     ON CONFLICT (email) DO UPDATE SET fullname = EXCLUDED.fullname
     RETURNING id`,
    ['Đàm Long Nhật', 'sinhvien@ictu.edu.vn', studentHash, '0987654321']
  );

  const secondStudentRes = await db.query(
    `INSERT INTO users (fullname, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'user')
     ON CONFLICT (email) DO UPDATE SET fullname = EXCLUDED.fullname
     RETURNING id`,
    ['Nguyễn Minh Anh', 'minhanh@ictu.edu.vn', studentHash, '0976543210']
  );

  await db.query(
    `INSERT INTO users (fullname, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ['Quản trị viên UniExchange', 'admin@ictu.edu.vn', adminHash, '0912345678']
  );

  const sellerMap = {
    nhat: studentRes.rows[0].id,
    minhanh: secondStudentRes.rows[0].id,
  };

  const { rows: categories } = await db.query('SELECT id, slug FROM categories');
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  for (const item of SAMPLE_LISTINGS) {
    const categoryId = categoryMap.get(item.categorySlug) || categories[0]?.id;
    if (!categoryId) continue;

    const existing = await db.query('SELECT id FROM posts WHERE title = $1 LIMIT 1', [item.title]);
    if (existing.rows.length > 0) {
      continue;
    }

    const postRes = await db.query(
      `INSERT INTO posts (user_id, category_id, title, description, price, condition, type, status, images_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', $8::jsonb)
       RETURNING id`,
      [
        sellerMap[item.sellerKey] || sellerMap.nhat,
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
