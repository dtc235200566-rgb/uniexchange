import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Trash2, EyeOff, Check, Plus } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Badge, Button, Card, Input } from '../components/ui';
import { formatDate } from '../lib/format';

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('reports');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: reportsData, isLoading: loadingReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => apiRequest('/api/reports'),
  });

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const handleReportAction = async (reportId, status, action) => {
    setMessage('');
    setErrorMsg('');
    try {
      await apiRequest(`/api/reports/${reportId}`, {
        method: 'PATCH',
        body: { status, action },
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setMessage('Đã xử lý báo cáo vi phạm.');
    } catch (err) {
      setErrorMsg(err.message || 'Thao tác thất bại.');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    if (!catName.trim()) {
      setErrorMsg('Tên danh mục không được để trống.');
      return;
    }
    try {
      await apiRequest('/api/categories', {
        method: 'POST',
        body: { name: catName.trim(), description: catDesc.trim() },
      });
      setCatName('');
      setCatDesc('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setMessage('Đã thêm danh mục mới.');
    } catch (err) {
      setErrorMsg(err.message || 'Không thể thêm danh mục.');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"?`)) return;
    setMessage('');
    setErrorMsg('');
    try {
      await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      setMessage('Đã xóa danh mục.');
    } catch (err) {
      setErrorMsg(err.message || 'Không thể xóa danh mục.');
    }
  };

  const reports = reportsData?.reports || [];
  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Bảng điều khiển Quản trị viên</h1>
            <p className="text-sm text-slate-500">Xử lý tin báo cáo vi phạm và quản lý danh mục đồ cũ</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={tab === 'reports' ? 'primary' : 'outline'}
            onClick={() => setTab('reports')}
          >
            Tin bị báo cáo ({reports.filter((r) => r.status === 'pending').length})
          </Button>
          <Button
            variant={tab === 'categories' ? 'primary' : 'outline'}
            onClick={() => setTab('categories')}
          >
            Quản lý danh mục ({categories.length})
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {message}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      {tab === 'reports' ? (
        <Card className="overflow-hidden">
          {loadingReports ? (
            <p className="p-8 text-center text-sm text-slate-500">Đang tải danh sách báo cáo...</p>
          ) : reports.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Chưa có báo cáo vi phạm nào.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          rep.status === 'pending'
                            ? 'amber'
                            : rep.status === 'resolved'
                              ? 'emerald'
                              : 'default'
                        }
                      >
                        {rep.status === 'pending'
                          ? 'Chờ xử lý'
                          : rep.status === 'resolved'
                            ? 'Đã xử lý'
                            : 'Đã bỏ qua'}
                      </Badge>
                      <Link
                        to={`/listings/${rep.post_id}`}
                        className="font-bold text-slate-900 hover:text-blue-600"
                      >
                        {rep.post_title}
                      </Link>
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">Lý do:</span> {rep.reason}
                    </p>
                    <p className="text-xs text-slate-500">
                      Người báo cáo: {rep.reporter_name} ({rep.reporter_email}) • Người đăng:{' '}
                      {rep.owner_name} • {formatDate(rep.created_at)}
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportAction(rep.id, 'resolved', 'hide_post')}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Ẩn tin
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReportAction(rep.id, 'resolved', 'delete_post')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa tin
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReportAction(rep.id, 'dismissed')}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Bỏ qua
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="p-6 lg:col-span-5">
            <h2 className="text-base font-bold text-slate-900">Thêm danh mục mới</h2>
            <form onSubmit={handleAddCategory} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tên danh mục</label>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="VD: Dụng cụ thể thao"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                <Input
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Mô tả ngắn gọn về danh mục"
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4" />
                Thêm danh mục
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden lg:col-span-7">
            {loadingCategories ? (
              <p className="p-6 text-sm text-slate-500">Đang tải danh mục...</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {cat.name}{' '}
                        <span className="text-xs font-normal text-slate-400">/{cat.slug}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {cat.description || 'Không có mô tả'} • {cat.active_posts_count || 0} tin đang mở
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
