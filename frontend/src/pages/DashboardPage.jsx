import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit3, Trash2, CheckCircle, EyeOff, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Badge, Button, Card } from '../components/ui';
import { formatDate, formatPrice, resolveImageUrl, STATUS_LABELS } from '../lib/format';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => apiRequest('/api/posts/my'),
  });

  const posts = data?.items || [];

  const handleStatusChange = async (postId, nextStatus) => {
    setBusyId(postId);
    setFeedback('');
    try {
      await apiRequest(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setFeedback('Đã cập nhật trạng thái tin đăng.');
    } catch (err) {
      setFeedback(err.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (postId, title) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tin "${title}" không?`)) {
      return;
    }
    setBusyId(postId);
    setFeedback('');
    try {
      await apiRequest(`/api/posts/${postId}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setFeedback('Đã xóa tin đăng thành công.');
    } catch (err) {
      setFeedback(err.message || 'Không thể xóa tin đăng.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản lý tin đăng cá nhân</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi trạng thái, chỉnh sửa, đánh dấu đã bán hoặc gỡ tin của bạn.
          </p>
        </div>
        <Link to="/create-listing">
          <Button>
            <PlusCircle className="h-4 w-4" />
            Đăng tin mới
          </Button>
        </Link>
      </div>

      {feedback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          {feedback}
        </div>
      )}

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-slate-500">Đang tải tin đăng của bạn...</Card>
      ) : isError ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-red-600">{error.message}</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-base font-semibold text-slate-800">Bạn chưa đăng tin nào.</p>
          <p className="mt-1 text-sm text-slate-500">
            Hãy đăng món đồ đầu tiên để kết nối với các bạn sinh viên khác!
          </p>
          <Link to="/create-listing" className="mt-4 inline-block">
            <Button>Đăng tin ngay</Button>
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3.5">Sản phẩm</th>
                  <th className="px-4 py-3.5">Danh mục</th>
                  <th className="px-4 py-3.5">Giá</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ngày đăng</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/listings/${post.id}`}
                        className="flex items-center gap-3 font-semibold text-slate-900 hover:text-blue-600"
                      >
                        <img
                          src={resolveImageUrl(post.images?.[0])}
                          alt={post.title}
                          className="h-12 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <span className="line-clamp-2 max-w-xs">{post.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{post.category_name}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-700">
                      {formatPrice(post.price, post.type)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant={
                          post.status === 'available'
                            ? 'emerald'
                            : post.status === 'sold'
                              ? 'red'
                              : 'default'
                        }
                      >
                        {STATUS_LABELS[post.status] || post.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(post.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link to={`/edit-listing/${post.id}`}>
                          <Button variant="outline" size="sm" title="Sửa tin">
                            <Edit3 className="h-3.5 w-3.5" />
                            Sửa
                          </Button>
                        </Link>

                        {post.status !== 'sold' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === post.id}
                            onClick={() => handleStatusChange(post.id, 'sold')}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                            Đã bán
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === post.id}
                            onClick={() => handleStatusChange(post.id, 'available')}
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
                            Mở lại
                          </Button>
                        )}

                        {post.status !== 'hidden' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === post.id}
                            onClick={() => handleStatusChange(post.id, 'hidden')}
                            title="Ẩn tin"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === post.id}
                            onClick={() => handleStatusChange(post.id, 'available')}
                          >
                            Hiện
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busyId === post.id}
                          onClick={() => handleDelete(post.id, post.title)}
                          title="Xóa tin"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
