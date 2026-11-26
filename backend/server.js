require('dotenv').config();
const { createApp } = require('./src/app');
const { initializeDatabase } = require('./src/config/initDb');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await initializeDatabase();
    console.log('PostgreSQL schema & seed initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`UniExchange Backend listening on port ${PORT}`);
  });
}

start();
