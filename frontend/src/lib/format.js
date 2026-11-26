const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export function formatPrice(price, type) {
  const num = Number(price || 0);
  if (type === 'giveaway' || num === 0) {
    return 'Tặng miễn phí';
  }
  return `${new Intl.NumberFormat('vi-VN').format(num)}đ`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function resolveImageUrl(url) {
  if (!url) {
    return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const TYPE_LABELS = {
  sell: 'Bán lại',
  giveaway: 'Tặng miễn phí',
  exchange: 'Trao đổi',
};

export const STATUS_LABELS = {
  available: 'Đang bán',
  sold: 'Đã bán',
  hidden: 'Đã ẩn',
};
