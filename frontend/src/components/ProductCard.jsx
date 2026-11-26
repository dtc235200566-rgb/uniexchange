import { Link } from 'react-router-dom';
import { Tag, User, Clock } from 'lucide-react';
import { Badge, Card } from './ui';
import { formatDate, formatPrice, resolveImageUrl, TYPE_LABELS } from '../lib/format';

export default function ProductCard({ post }) {
  const coverImage = resolveImageUrl(post.images?.[0]);
  const isFree = post.type === 'giveaway' || Number(post.price) === 0;
  const isSold = post.status === 'sold';

  return (
    <Link to={`/listings/${post.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={coverImage}
            alt={post.title}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSold ? 'opacity-60 grayscale-[30%]' : ''
            }`}
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge variant={isFree ? 'emerald' : post.type === 'exchange' ? 'amber' : 'blue'}>
              {TYPE_LABELS[post.type] || 'Bán lại'}
            </Badge>
            {isSold && <Badge variant="red">Đã bán</Badge>}
          </div>
          {post.condition && (
            <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-slate-900/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {post.condition}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-blue-600">
            <Tag className="h-3.5 w-3.5" />
            <span>{post.category_name}</span>
          </div>

          <h3 className="line-clamp-2 text-base font-bold text-slate-900 group-hover:text-blue-600">
            {post.title}
          </h3>

          <p
            className={`mt-2 text-lg font-extrabold ${
              isFree ? 'text-emerald-600' : 'text-blue-700'
            }`}
          >
            {formatPrice(post.price, post.type)}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 truncate">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{post.seller?.fullname || 'Sinh viên'}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
