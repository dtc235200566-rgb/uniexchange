import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
        <div>
          <span className="font-bold text-slate-800">UniExchange</span> — Nền tảng trao đổi, mua bán đồ cũ sinh viên ICTU (Nhóm 1 • Điện toán đám mây).
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-blue-600">
            Trang chủ
          </Link>
          <Link to="/create-listing" className="hover:text-blue-600">
            Đăng tin
          </Link>
          <Link to="/dashboard" className="hover:text-blue-600">
            Quản lý tin
          </Link>
        </div>
      </div>
    </footer>
  );
}
