import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Input } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (fullname.trim().length < 2) {
      next.fullname = 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = 'Vui lòng nhập email đúng định dạng (khuyên dùng .edu.vn).';
    }
    if (phone.trim() && !/^[0-9+\-\s]{8,15}$/.test(phone.trim())) {
      next.phone = 'Số điện thoại từ 8 đến 15 chữ số.';
    }
    if (password.length < 6) {
      next.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        fullname: fullname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-4">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tạo tài khoản sinh viên</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tham gia cộng đồng trao đổi đồ cũ UniExchange ICTU.
          </p>
        </div>

        {serverError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Họ và tên</label>
            <Input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Đàm Long Nhật"
              error={errors.fullname}
            />
            {errors.fullname && <p className="mt-1 text-xs text-red-600">{errors.fullname}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email (ưu tiên .edu.vn)
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sinhvien@ictu.edu.vn"
              error={errors.email}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Số điện thoại (tùy chọn)
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0987654321"
              error={errors.phone}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              error={errors.password}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Xác nhận mật khẩu
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              error={errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
