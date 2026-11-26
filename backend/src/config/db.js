const { Pool } = require('pg');

/**
 * Create and configure the PostgreSQL connection pool.
 * Uses SSL in production environments (e.g., Render Managed PostgreSQL)
 * unless explicitly disabled.
 */
function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const useSsl =
    process.env.DATABASE_SSL === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'false');

  return new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });
}

const pool = createPool();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
