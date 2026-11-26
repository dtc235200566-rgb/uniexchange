const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const TOKEN_STORAGE_KEY = 'uniexchange_token';
export const USER_STORAGE_KEY = 'uniexchange_user';

export class ApiError extends Error {
  constructor(status, message, errors = null) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, isFormData = false } = {}) {
  const authToken = token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = {};

  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message || `Yêu cầu thất bại (${response.status})`,
      payload?.errors || null
    );
  }

  return payload;
}

export { API_BASE_URL };
