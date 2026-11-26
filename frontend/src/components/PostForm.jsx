import { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Link2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from './ui';
import { resolveImageUrl } from '../lib/format';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CONDITIONS = ['Mới 100%', 'Mới 95%', 'Mới 90%', 'Còn tốt', 'Đã qua sử dụng', 'Cần sửa nhẹ'];

export default function PostForm({
  categories = [],
  initialValues = null,
  onSubmit,
  submitting = false,
  submitLabel = 'Đăng tin',
  serverError = '',
}) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id ? String(initialValues.category_id) : ''
  );
  const [type, setType] = useState(initialValues?.type || 'sell');
  const [price, setPrice] = useState(
    initialValues?.price !== undefined ? String(Math.round(Number(initialValues.price))) : ''
  );
  const [condition, setCondition] = useState(initialValues?.condition || 'Còn tốt');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [existingImages, setExistingImages] = useState(initialValues?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (type === 'giveaway') {
      setPrice('0');
      setErrors((prev) => ({ ...prev, price: '' }));
    }
  }, [type]);

  const handlePriceChange = (e) => {
    const raw = e.target.value;
    // Block non-digit characters (letters like "năm mươi nghìn") per TC02
    if (raw !== '' && !/^\d+$/.test(raw)) {
      setErrors((prev) => ({ ...prev, price: 'Giá bán chỉ được nhập ký tự số (VNĐ).' }));
      return;
    }
    setErrors((prev) => ({ ...prev, price: '' }));
    setPrice(raw);
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + newFiles.length + files.length;
    if (totalCount > 5) {
      setErrors((prev) => ({ ...prev, images: 'Tối đa 5 ảnh cho mỗi tin đăng.' }));
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, images: `Tệp "${file.name}" không phải là hình ảnh.` }));
        return;
      }
      if (file.size >= MAX_FILE_SIZE) {
        setErrors((prev) => ({
          ...prev,
          images: `Ảnh "${file.name}" vượt quá giới hạn 5MB.`,
        }));
        return;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setErrors((prev) => ({ ...prev, images: '' }));
    setNewFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const handleAddExternalUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      setErrors((prev) => ({ ...prev, images: 'URL ảnh phải bắt đầu bằng http:// hoặc https://' }));
      return;
    }
    if (existingImages.length + newFiles.length >= 5) {
      setErrors((prev) => ({ ...prev, images: 'Tối đa 5 ảnh cho mỗi tin đăng.' }));
      return;
    }
    setExistingImages((prev) => [...prev, trimmed]);
    setImageUrlInput('');
    setErrors((prev) => ({ ...prev, images: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!title.trim()) {
      nextErrors.title = 'Vui lòng nhập tiêu đề tin đăng.';
    } else if (title.trim().length < 3) {
      nextErrors.title = 'Tiêu đề cần tối thiểu 3 ký tự.';
    }

    if (!categoryId) {
      nextErrors.category_id = 'Vui lòng chọn danh mục.';
    }

    if (type !== 'giveaway') {
      if (price === '' || !/^\d+$/.test(price)) {
        nextErrors.price = 'Vui lòng nhập giá bán hợp lệ bằng số.';
      }
    }

    if (!description.trim() || description.trim().length < 5) {
      nextErrors.description = 'Vui lòng nhập mô tả chi tiết (tối thiểu 5 ký tự).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category_id', categoryId);
    formData.append('type', type);
    formData.append('price', type === 'giveaway' ? '0' : price);
    formData.append('condition', condition);
    formData.append('description', description.trim());
    formData.append('existing_images', JSON.stringify(existingImages));

    newFiles.forEach((item) => {
      formData.append('images', item.file);
    });

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Tiêu đề tin đăng <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="VD: Bán giáo trình Giải tích 1 còn mới 95%"
          error={errors.title}
        />
        {errors.title && <p className="mt-1 text-xs font-medium text-red-600">{errors.title}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.category_id}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          {errors.category_id && (
            <p className="mt-1 text-xs font-medium text-red-600">{errors.category_id}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Hình thức</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="sell">Bán lại</option>
            <option value="giveaway">Tặng miễn phí (0đ)</option>
            <option value="exchange">Trao đổi đồ</option>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tình trạng</label>
          <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Giá bán (VNĐ) <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          inputMode="numeric"
          value={price}
          onChange={handlePriceChange}
          disabled={type === 'giveaway'}
          placeholder={type === 'giveaway' ? '0đ (Tặng miễn phí)' : 'VD: 50000'}
          error={errors.price}
        />
        {errors.price ? (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.price}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Nhập 0 nếu muốn tặng miễn phí. Chỉ chấp nhận chữ số.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Mô tả chi tiết <span className="text-red-500">*</span>
        </label>
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
          }}
          placeholder="Mô tả tình trạng sử dụng, địa điểm giao dịch thuận tiện quanh khu vực trường..."
          error={errors.description}
        />
        {errors.description && (
          <p className="mt-1 text-xs font-medium text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          Hình ảnh sản phẩm (Tối đa 5 ảnh, mỗi ảnh &lt; 5MB)
        </label>

        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-3 text-center">
            <div className="rounded-full bg-blue-50 p-2.5 text-blue-600">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium text-slate-700">
              Bấm để chọn ảnh từ máy hoặc điện thoại
            </div>
            <div className="text-xs text-slate-500">Hỗ trợ JPG, PNG, WEBP (&lt; 5MB)</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
          </label>

          <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
            <Input
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Hoặc dán URL ảnh (https://...)"
            />
            <Button type="button" variant="outline" onClick={handleAddExternalUrl}>
              <Link2 className="h-4 w-4" />
              Thêm URL
            </Button>
          </div>
        </div>

        {errors.images && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.images}</p>}

        {(existingImages.length > 0 || newFiles.length > 0) && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {existingImages.map((url, idx) => (
              <div
                key={`existing-${idx}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <img
                  src={resolveImageUrl(url)}
                  alt="Ảnh đã tải"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/75 p-1 text-white hover:bg-red-600"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {newFiles.map((item, idx) => (
              <div
                key={`new-${idx}`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-blue-200 bg-white"
              >
                <img
                  src={item.preview}
                  alt="Ảnh mới chọn"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="absolute right-1.5 top-1.5 rounded-full bg-slate-900/75 p-1 text-white hover:bg-red-600"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Đang xử lý...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
