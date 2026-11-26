import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import PostForm from '../components/PostForm';

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const { data: postData, isLoading, isError } = useQuery({
    queryKey: ['post', id, 'edit'],
    queryFn: () => apiRequest(`/api/posts/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const post = postData?.post;
  if (isError || !post) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="font-semibold text-slate-800">Không tìm thấy tin đăng cần chỉnh sửa.</p>
        <Link to="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Về trang quản lý</Button>
        </Link>
      </Card>
    );
  }

  if (user?.id !== post.user_id && user?.role !== 'admin') {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <p className="font-semibold text-red-600">
          403 Forbidden: Bạn không có quyền chỉnh sửa tin đăng của người khác.
        </p>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="outline">Về trang chủ</Button>
        </Link>
      </Card>
    );
  }

  const handleUpdate = async (formData) => {
    setSubmitting(true);
    setServerError('');
    try {
      await apiRequest(`/api/posts/${id}`, {
        method: 'PUT',
        body: formData,
        isFormData: true,
      });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      await queryClient.invalidateQueries({ queryKey: ['post', id] });
      navigate(`/listings/${id}`);
    } catch (err) {
      setServerError(err.message || 'Không thể cập nhật tin đăng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại quản lý tin
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Chỉnh sửa tin đăng</h1>
      </div>

      <Card className="p-6 sm:p-8">
        <PostForm
          categories={categoriesData?.categories || []}
          initialValues={post}
          onSubmit={handleUpdate}
          submitting={submitting}
          submitLabel="Lưu thay đổi"
          serverError={serverError}
        />
      </Card>
    </div>
  );
}
