# UniExchange — Nền tảng trao đổi, mua bán đồ cũ dành cho sinh viên

Dự án thuộc học phần **Điện toán đám mây** (Trường Đại học Công nghệ Thông tin và Truyền thông - ICTU, Nhóm 1).

## 1. Kiến trúc & Công nghệ

- **Frontend (SPA)**: ReactJS 18 + Vite + Tailwind CSS + component chuẩn Shadcn/UI + React Query (`@tanstack/react-query`) + React Context API (`AuthContext`).
- **Backend (RESTful API)**: Node.js + Express.js + JWT (`jsonwebtoken`) + `bcryptjs` + `multer` (upload ảnh < 5MB) + CORS.
- **Cơ sở dữ liệu**: PostgreSQL (chuẩn 3NF gồm `users`, `categories`, `posts`, `listing_images`, `reports`).
- **Triển khai đám mây**: Render (Managed PostgreSQL + Backend Web Service + Frontend Static Site + `render.yaml`).

## 2. Cấu trúc thư mục

```text
uniexchange/
├── database/
│   ├── schema.sql          # Khởi tạo 5 bảng PostgreSQL & ràng buộc khóa ngoại
│   └── seed.sql            # Danh mục mặc định
├── backend/
│   ├── server.js           # Entry point (Start command: node server.js)
│   ├── src/
│   │   ├── app.js          # Express app, CORS, static /uploads, error handler
│   │   ├── config/         # Kết nối Pool PostgreSQL & auto-init schema/seed
│   │   ├── middleware/     # JWT auth, requireAdmin, multer (<5MB)
│   │   ├── routes/         # auth, categories, posts (/api/posts & /api/listings), reports, upload
│   │   └── utils/          # Validators & AppError
│   └── tests/api.test.js   # Unit & IDOR authorization tests
├── frontend/
│   └── src/
│       ├── context/        # AuthContext (JWT trong localStorage)
│       ├── components/     # Navbar, ProductCard, ImageSlider, PostForm, ReportModal, ProtectedRoute
│       └── pages/          # HomePage, PostDetailPage, CreateListingPage, EditListingPage, DashboardPage, AdminPage, LoginPage, RegisterPage
└── render.yaml             # Render Blueprint (1-click deploy)
```

## 3. Hướng dẫn chạy Local

Yêu cầu cài đặt **Node.js (>= 18)** và **PostgreSQL (>= 14)**.

### Bước 1: Tạo database PostgreSQL
Tạo database tên `uniexchange` (backend sẽ tự động chạy `schema.sql` và `seed.sql` khi khởi động):
```sql
CREATE DATABASE uniexchange;
```

### Bước 2: Chạy Backend
```bash
cd backend
cp .env.example .env
# Cập nhật DATABASE_URL và JWT_SECRET trong .env
npm install
npm test
npm start
```
Backend mặc định chạy tại `http://localhost:5000` (health check: `GET /api/health`).

### Bước 3: Chạy Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend chạy tại `http://localhost:5173`.

## 4. Triển khai lên Render

1. Đẩy thư mục `uniexchange` lên kho GitHub.
2. Trên Render Dashboard, chọn **New -> Blueprint** và trỏ tới file `render.yaml` (hoặc tạo thủ công 3 dịch vụ):
   - **Managed PostgreSQL**: Lấy `Internal Database URL` gán vào `DATABASE_URL` của Backend.
   - **Web Service (Backend)**: Root Directory `backend`, Build `npm install`, Start `node server.js`, cấu hình `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `DATABASE_SSL=true`.
   - **Static Site (Frontend)**: Root Directory `frontend`, Build `npm install && npm run build`, Publish Directory `dist`, cấu hình `VITE_API_URL` trỏ tới URL của Backend Web Service và thêm Rewrite Rule `/* -> /index.html`.

## 5. Tài khoản Demo mặc định (khi `SEED_DEMO_DATA=true`)

- **Sinh viên**: `sinhvien@ictu.edu.vn` / `123456`
- **Quản trị viên**: `admin@ictu.edu.vn` / `Admin@123`
