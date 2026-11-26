import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Card } from '../components/ui';
import PostForm from '../components/PostForm';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
  });

  const handleCreate = async (formData) => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await apiRequest('/api/posts', {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      navigate(`/listings/${res.id}`);
    } catch (err) {
      setServerError(err.message || 'Không thể đăng tin. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Đăng tin trao đổi / bán đồ cũ</h1>
        <p className="mt-1 text-sm text-slate-500">
          Điền đầy đủ thông tin và hình ảnh rõ nét để sinh viên khác dễ tìm thấy món đồ của bạn.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <PostForm
          categories={categoriesData?.categories || []}
          onSubmit={handleCreate}
          submitting={submitting}
          submitLabel="Đăng tin ngay"
          serverError={serverError}
        />
      </Card>
    </div>
  );
}
