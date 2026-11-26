const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;

const ALLOWED_TYPES = ['sell', 'giveaway', 'exchange'];
const ALLOWED_STATUSES = ['available', 'sold', 'hidden'];
const ALLOWED_REPORT_STATUSES = ['pending', 'resolved', 'dismissed'];

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function isValidPhone(phone) {
  if (phone === undefined || phone === null || String(phone).trim() === '') {
    return true;
  }
  return PHONE_REGEX.test(String(phone).trim());
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate listing/post payload for creation or update.
 * Returns { errors, data }.
 */
function validatePostInput(body, { partial = false } = {}) {
  const errors = {};
  const data = {};

  if (!partial || body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      errors.title = 'Tiêu đề tin đăng không được để trống.';
    } else if (title.length < 3 || title.length > 255) {
      errors.title = 'Tiêu đề phải từ 3 đến 255 ký tự.';
    } else {
      data.title = title;
    }
  }

  if (!partial || body.description !== undefined) {
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (!description) {
      errors.description = 'Mô tả sản phẩm không được để trống.';
    } else if (description.length < 5) {
      errors.description = 'Mô tả cần tối thiểu 5 ký tự.';
    } else {
      data.description = description;
    }
  }

  if (!partial || body.category_id !== undefined) {
    const categoryId = Number(body.category_id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      errors.category_id = 'Vui lòng chọn danh mục hợp lệ.';
    } else {
      data.category_id = categoryId;
    }
  }

  if (!partial || body.type !== undefined) {
    const type = body.type === undefined ? 'sell' : String(body.type).trim();
    if (!ALLOWED_TYPES.includes(type)) {
      errors.type = 'Hình thức tin không hợp lệ.';
    } else {
      data.type = type;
    }
  }

  if (!partial || body.price !== undefined) {
    if (data.type === 'giveaway') {
      data.price = 0;
    } else if (body.price === '' || body.price === null || body.price === undefined) {
      if (!partial) {
        errors.price = 'Vui lòng nhập giá bán bằng số.';
      }
    } else {
      const raw = String(body.price).trim();
      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || numeric < 0) {
        errors.price = 'Giá bán phải là số lớn hơn hoặc bằng 0.';
      } else {
        data.price = numeric;
      }
    }
  }

  if (!partial || body.condition !== undefined) {
    const condition = typeof body.condition === 'string' ? body.condition.trim() : 'Còn tốt';
    data.condition = condition || 'Còn tốt';
  }

  if (body.status !== undefined) {
    const status = String(body.status).trim();
    if (!ALLOWED_STATUSES.includes(status)) {
      errors.status = 'Trạng thái tin không hợp lệ.';
    } else {
      data.status = status;
    }
  }

  return { errors, data };
}

module.exports = {
  ALLOWED_TYPES,
  ALLOWED_STATUSES,
  ALLOWED_REPORT_STATUSES,
  isValidEmail,
  isValidPhone,
  slugify,
  validatePostInput,
};
