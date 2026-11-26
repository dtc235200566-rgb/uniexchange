import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Button, Card, Input, Select } from '../components/ui';
import ProductCard from '../components/ProductCard';

const MAX_SLIDER_PRICE = 2000000;

export default function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [maxPrice, setMaxPrice] = useState(MAX_SLIDER_PRICE);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Debounce search query (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest('/api/categories'),
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData?.categories || [];

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: '12',
    sort,
  });
  if (debouncedSearch) queryParams.set('search', debouncedSearch);
  if (category !== 'all') queryParams.set('category', category);
  if (type !== 'all') queryParams.set('type', type);
  if (maxPrice < MAX_SLIDER_PRICE) queryParams.set('maxPrice', String(maxPrice));

  const {
    data: postsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['posts', debouncedSearch, category, type, maxPrice, sort, page],
    queryFn: () => apiRequest(`/api/posts?${queryParams.toString()}`),
  });

  const posts = postsData?.items || [];
  const pagination = postsData?.pagination || { page: 1, totalPages: 1, total: 0 };

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategory('all');
    setType('all');
    setMaxPrice(MAX_SLIDER_PRICE);
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Nền tảng trao đổi đồ cũ dành riêng cho sinh viên ICTU
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tìm đồ học tập giá hời, trao đổi nhanh ngay trong khuôn viên trường
          </h1>
          <p className="text-sm text-blue-100 sm:text-base">
            Giáo trình kỳ trước, đèn bàn, máy tính bỏ túi hay đồ dùng phòng trọ — đăng tin dễ dàng,
            kết nối trực tiếp giữa sinh viên với nhau.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/create-listing">
              <Button
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50"
              >
                <PlusCircle className="h-5 w-5" />
                Đăng bán / Tặng đồ ngay
              </Button>
            </Link>
            <Button
              size="lg"
              variant="ghost"
              className="border border-white/30 text-white hover:bg-white/10"
              onClick={() => {
                setType('giveaway');
                setMaxPrice(0);
                setPage(1);
              }}
            >
              Xem đồ tặng miễn phí
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-2xl" />
      </section>

      {/* Search & Filter Panel */}
      <Card className="p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm giáo trình, Casio, đèn bàn..."
              className="pl-10"
              aria-label="Tìm kiếm tin đăng"
            />
          </div>

          <div className="md:col-span-3">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo danh mục"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              aria-label="Hình thức tin"
            >
              <option value="all">Mọi hình thức</option>
              <option value="sell">Bán lại</option>
              <option value="giveaway">Tặng miễn phí</option>
              <option value="exchange">Trao đổi</option>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="Sắp xếp"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
            </Select>
          </div>
        </div>

        {/* Price range slider + quick filters */}
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              <span>Khoảng giá tối đa:</span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700">
                {maxPrice >= MAX_SLIDER_PRICE
                  ? 'Không giới hạn'
                  : maxPrice === 0
                    ? '0đ (Miễn phí)'
                    : `${new Intl.NumberFormat('vi-VN').format(maxPrice)}đ`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_SLIDER_PRICE}
              step={10000}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setPage(1);
              }}
              className="uni-slider max-w-xs"
              aria-label="Thanh trượt khoảng giá"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMaxPrice(50000);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                maxPrice === 50000
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Dưới 50.000đ
            </button>
            <button
              type="button"
              onClick={() => {
                setMaxPrice(0);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                maxPrice === 0
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tặng miễn phí (0đ)
            </button>
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.slug);
                  setPage(1);
                }}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  category === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Listings Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Tin đăng mới nhất
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({pagination.total} sản phẩm)
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-44 rounded-xl bg-slate-200" />
                <div className="mt-4 h-4 w-1/3 rounded bg-slate-200" />
                <div className="mt-2 h-5 w-4/5 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-medium text-red-600">
              Không thể tải danh sách tin đăng: {error.message}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Thử lại
            </Button>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-base font-semibold text-slate-800">
              Chưa tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Hãy thử đổi từ khóa hoặc nới rộng khoảng giá để xem thêm tin đăng.
            </p>
            <Button variant="outline" className="mt-4" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {posts.map((post) => (
                <ProductCard key={post.id} post={post} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <span className="px-3 text-sm font-medium text-slate-700">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
