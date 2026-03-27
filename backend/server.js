const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase, DB_PATH } = require('./db');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5001);
let isDbConnected = false;
let lastDbError = '';

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5174,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'fitai-backend',
    db: isDbConnected,
    dbError: lastDbError,
    dbType: 'sqlite',
    dbPath: DB_PATH,
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/diet', require('./routes/diet'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/rewards', require('./routes/rewards'));

try {
  initDatabase();
  isDbConnected = true;
  lastDbError = '';
  console.log(`SQLite connected at ${DB_PATH}`);
} catch (error) {
  isDbConnected = false;
  lastDbError = error.message;
  console.error(`SQLite initialization error: ${error.message}`);
}

const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Set a different PORT in backend/.env or stop the other process.`);
    return;
  }

  console.error(error);
});
