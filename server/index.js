import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getPool, sql } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Parameterized database query test endpoint (Phase 7)
app.get('/api/test-db', async (req, res, next) => {
  try {
    const pool = await getPool();
    const message = req.query.message || 'connection_verified';
    const result = await pool.request()
      .input('testParam', sql.NVarChar, message)
      .query('SELECT @testParam AS echo, DB_NAME() AS databaseName, GETDATE() AS serverTime');

    res.status(200).json({
      status: 'ok',
      result: result.recordset[0]
    });
  } catch (err) {
    next(err);
  }
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
