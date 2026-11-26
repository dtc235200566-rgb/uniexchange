-- Initial seed data for UniExchange

INSERT INTO categories (name, slug, description)
VALUES
  ('Giáo trình & Sách', 'giao-trinh', 'Giáo trình đại cương, sách chuyên ngành, tài liệu ôn thi'),
  ('Đồ điện tử', 'do-dien-tu', 'Laptop, bàn phím, chuột, tai nghe, máy tính bỏ túi'),
  ('Nội thất & Phòng trọ', 'noi-that', 'Bàn học gấp, đèn bàn, giá sách, quạt, đồ dùng phòng trọ'),
  ('Phương tiện', 'phuong-tien', 'Xe đạp, xe máy điện, mũ bảo hiểm, phụ kiện'),
  ('Đồ gia dụng', 'do-gia-dung', 'Ấm siêu tốc, nồi cơm điện, bình giữ nhiệt, hộp cơm'),
  ('Khác', 'khac', 'Dụng cụ học tập, balo, đồ thể thao và vật dụng sinh viên khác')
ON CONFLICT (slug) DO NOTHING;
