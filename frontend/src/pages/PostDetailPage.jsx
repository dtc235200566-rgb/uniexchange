import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  Lock,
  Flag,
  Edit3,
  User,
  Calendar,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card } from '../components/ui';
import ImageSlider from '../components/ImageSlider';
import ReportModal from '../components/ReportModal';
import { formatDate, formatPrice, STATUS_LABELS, TYPE_LABELS } from '../lib/format';

export default function PostDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['post', id, isAuthenticated],
    queryFn: () => apiRequest(`/api/posts/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data?.post) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy tin đăng</h2>
        <p className="mt-1 text-sm text-slate-500">
          {error?.message || 'Tin đăng có thể đã bị xóa hoặc đang bị ẩn.'}
        </p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline">Quay lại trang chủ</Button>
        </Link>
      </Card>
    );
  }

  const post = data.post;
  const isOwner = user?.id === post.user_id;
  const isFree = post.type === 'giveaway' || Number(post.price) === 0;

  const handleContactAction = (kind) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (kind === 'phone') setShowPhone(true);
    if (kind === 'email') setShowEmail(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        {isOwner && (
          <Link to={`/edit-listing/${post.id}`}>
            <Button variant="outline" size="sm">
              <Edit3 className="h-4 w-4" />
              Chỉnh sửa tin này
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Image Slider */}
        <div className="lg:col-span-7">
          <ImageSlider images={post.images} title={post.title} />
        </div>

        {/* Right: Product Info & Seller Contact */}
        <div className="space-y-5 lg:col-span-5">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue">
                <Tag className="mr-1 h-3 w-3" />
                {post.category_name}
              </Badge>
              <Badge variant={isFree ? 'emerald' : post.type === 'exchange' ? 'amber' : 'default'}>
                {TYPE_LABELS[post.type] || 'Bán lại'}
              </Badge>
              <Badge variant={post.status === 'sold' ? 'red' : 'emerald'}>
                {STATUS_LABELS[post.status] || post.status}
              </Badge>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{post.title}</h1>

            <p
              className={`mt-3 text-3xl font-extrabold ${
                isFree ? 'text-emerald-600' : 'text-blue-700'
              }`}
            >
              {formatPrice(post.price, post.type)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 text-sm">
              <div>
                <p className="text-xs text-slate-500">Tình trạng</p>
                <p className="font-semibold text-slate-800">{post.condition || 'Còn tốt'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ngày đăng</p>
                <p className="font-semibold text-slate-800">{formatDate(post.created_at)}</p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Mô tả chi tiết
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {post.description}
              </p>
            </div>
          </Card>

          {/* Seller Contact Card */}
          <Card className="p-6">
            <h2 className="text-base font-bold text-slate-900">Thông tin người bán</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{post.seller?.fullname}</p>
                <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Tham gia từ {formatDate(post.seller?.created_at)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {!isAuthenticated ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
                  <p className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4 shrink-0" />
                    Đăng nhập để xem SĐT và Email liên hệ
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  >
                    Đăng nhập để liên hệ người bán
                  </Button>
                </div>
              ) : (
                <>
                  {showPhone ? (
                    <a
                      href={post.seller?.phone ? `tel:${post.seller.phone}` : undefined}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <Phone className="h-4 w-4" />
                      {post.seller?.phone || 'Người bán chưa cập nhật SĐT'}
                    </a>
                  ) : (
                    <Button
                      variant="emerald"
                      className="w-full"
                      onClick={() => handleContactAction('phone')}
                    >
                      <Phone className="h-4 w-4" />
                      Lấy số điện thoại
                    </Button>
                  )}

                  {showEmail ? (
                    <a
                      href={`mailto:${post.seller?.email}?subject=${encodeURIComponent(
                        `[UniExchange] Quan tâm: ${post.title}`
                      )}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Mail className="h-4 w-4" />
                      {post.seller?.email}
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleContactAction('email')}
                    >
                      <Mail className="h-4 w-4" />
                      Gửi email
                    </Button>
                  )}
                </>
              )}
            </div>

            {isAuthenticated && !isOwner && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                {reportSuccess ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Đã gửi báo cáo vi phạm cho quản trị viên.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Báo cáo tin vi phạm
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {reportOpen && (
        <ReportModal
          postId={post.id}
          postTitle={post.title}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => setReportSuccess(true)}
        />
      )}
    </div>
  );
}
