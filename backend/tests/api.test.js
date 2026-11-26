const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/uniexchange_test';
process.env.JWT_SECRET = 'test-secret-key';

const db = require('../src/config/db');
const { createApp } = require('../src/app');
const { validatePostInput, isValidEmail } = require('../src/utils/validators');
const { authenticateToken, requireAdmin } = require('../src/middleware/auth');

function requestJson(server, method, path, { token, body } = {}) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('validatePostInput rejects empty title and non-numeric price', () => {
  const res = validatePostInput({
    title: '',
    description: 'Sách còn mới',
    price: 'năm mươi nghìn',
    category_id: 1,
    type: 'sell',
  });

  assert.ok(res.errors.title);
  assert.ok(res.errors.price);
});

test('validatePostInput sets price to 0 for giveaway posts', () => {
  const res = validatePostInput({
    title: 'Tặng giáo trình cũ',
    description: 'Còn dùng tốt cho bạn khóa sau',
    price: 50000,
    category_id: 1,
    type: 'giveaway',
  });

  assert.deepEqual(res.errors, {});
  assert.equal(res.data.price, 0);
});

test('isValidEmail validates student and standard emails', () => {
  assert.equal(isValidEmail('nhat@ictu.edu.vn'), true);
  assert.equal(isValidEmail('invalid-email'), false);
});

test('authenticateToken and requireAdmin enforce security checks', () => {
  let capturedErr = null;
  authenticateToken({ headers: {} }, {}, (err) => {
    capturedErr = err;
  });
  assert.equal(capturedErr.statusCode, 401);

  let adminErr = null;
  requireAdmin({ user: { id: 'u1', role: 'user' } }, {}, (err) => {
    adminErr = err;
  });
  assert.equal(adminErr.statusCode, 403);
});

test('IDOR protection: DELETE /api/posts/:id returns 403 when user is not owner', async () => {
  const originalQuery = db.query;
  const targetPostId = '11111111-1111-4111-8111-111111111111';
  const ownerId = '22222222-2222-4222-8222-222222222222';
  const attackerId = '33333333-3333-4333-8333-333333333333';

  db.query = async (sql) => {
    if (sql.includes('SELECT user_id FROM posts')) {
      return { rows: [{ user_id: ownerId }] };
    }
    return { rows: [], rowCount: 1 };
  };

  const app = createApp();
  const server = app.listen(0);

  try {
    const attackerToken = jwt.sign(
      { id: attackerId, email: 'attacker@ictu.edu.vn', role: 'user' },
      process.env.JWT_SECRET
    );
    const forbiddenRes = await requestJson(server, 'DELETE', `/api/posts/${targetPostId}`, {
      token: attackerToken,
    });
    assert.equal(forbiddenRes.status, 403);

    const adminToken = jwt.sign(
      { id: '44444444-4444-4444-8444-444444444444', email: 'admin@ictu.edu.vn', role: 'admin' },
      process.env.JWT_SECRET
    );
    const adminRes = await requestJson(server, 'DELETE', `/api/listings/${targetPostId}`, {
      token: adminToken,
    });
    assert.equal(adminRes.status, 200);
  } finally {
    db.query = originalQuery;
    server.close();
  }
});
