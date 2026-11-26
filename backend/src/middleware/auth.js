const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'uniexchange-dev-secret-change-in-production';
}

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/**
 * Require a valid JWT Bearer token. Attaches decoded payload to req.user.
 */
function authenticateToken(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return next(new AppError(401, 'Vui lòng đăng nhập để thực hiện thao tác này.'));
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch {
    return next(new AppError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'));
  }
}

/**
 * Attach req.user when a valid Bearer token is present; ignore invalid/absent tokens.
 */
function optionalAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, getJwtSecret());
  } catch {
    req.user = null;
  }
  return next();
}

/**
 * Restrict route access to administrator accounts.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'Bạn không có quyền quản trị để thực hiện thao tác này.'));
  }
  return next();
}

module.exports = {
  getJwtSecret,
  authenticateToken,
  optionalAuth,
  requireAdmin,
};
