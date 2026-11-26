import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Button, Textarea } from './ui';

export default function ReportModal({ postId, postTitle, onClose, onSubmitted }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Vui lòng nhập lý do báo cáo (tối thiểu 5 ký tự).');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await apiRequest('/api/reports', {
        method: 'POST',
        body: { post_id: postId, reason: reason.trim() },
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể gửi báo cáo lúc này.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-red-600">
            <Flag className="h-5 w-5" />
            <h3 className="text-lg font-bold text-slate-900">Báo cáo tin vi phạm</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Tin đăng: <span className="font-semibold text-slate-800">{postTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Lý do báo cáo</label>
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Sản phẩm bị cấm, thông tin sai sự thật, lừa đảo..."
              error={error}
            />
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
