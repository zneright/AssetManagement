import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from './db.js';
import { authenticateToken } from './middleware/auth.js';

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

// test connection lang sa db
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

// login route para makakuha ng token si user
app.post('/api/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // check muna if may laman yung username at password
    if (!username || !password || !username.trim() || !password.trim()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Username and password are required.'
      });
    }

    // hanapin si user sa database gamit parameterized query
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar(50), username.trim())
      .query('SELECT Id, Username, Password, FullName FROM Users WHERE Username = @username');

    const user = result.recordset[0];

    // pag walang nahanap na user sa db
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password.'
      });
    }

    // compare password hash gamit bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password.'
      });
    }

    // gawa ng jwt token para sa user session
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign(
      {
        id: user.Id,
        username: user.Username,
        fullName: user.FullName
      },
      secret,
      { expiresIn: '8h' }
    );

    // ibalik response pero wag na wag isasama yung password hash
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.Id,
        username: user.Username,
        fullName: user.FullName
      }
    });
  } catch (err) {
    next(err);
  }
});

// route pang test ng auth middleware
app.get('/api/protected-test', authenticateToken, (req, res) => {
  res.status(200).json({
    message: 'Access granted sa protected route!',
    user: req.user
  });
});

// kunin lahat ng assets sa db, naka order by pinakabago
app.get('/api/assets', authenticateToken, async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT Id, AssetName, Category, SerialNumber, Status, EstimatedValue, CreatedAt FROM Assets ORDER BY CreatedAt DESC');

    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
  }
});

// kunin yung specific na asset gamit id
app.get('/api/assets/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // check muna if valid number yung id
    const assetId = parseInt(id, 10);
    if (isNaN(assetId) || assetId <= 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Asset ID must be a valid positive integer.'
      });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, assetId)
      .query('SELECT Id, AssetName, Category, SerialNumber, Status, EstimatedValue, CreatedAt FROM Assets WHERE Id = @id');

    const asset = result.recordset[0];

    // pag walang nahanap na asset na may ganung id
    if (!asset) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Asset with ID ${assetId} was not found.`
      });
    }

    res.status(200).json(asset);
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
