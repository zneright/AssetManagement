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

// helper function para parehas validation sa create at update
function validateAssetInput(body) {
  const { AssetName, Category, SerialNumber, Status, EstimatedValue } = body || {};

  // check kung complete lahat ng fields
  if (!AssetName || !Category || !SerialNumber || !Status || EstimatedValue === undefined || EstimatedValue === null) {
    return {
      isValid: false,
      message: 'All fields are required: AssetName, Category, SerialNumber, Status, EstimatedValue.'
    };
  }

  // check kung may laman at hindi puro whitespace lang
  if (!String(AssetName).trim() || !String(Category).trim() || !String(SerialNumber).trim() || !String(Status).trim()) {
    return {
      isValid: false,
      message: 'Fields cannot be empty or whitespace only.'
    };
  }

  // check kung valid non-negative number
  const numericValue = parseFloat(EstimatedValue);
  if (isNaN(numericValue) || numericValue < 0) {
    return {
      isValid: false,
      message: 'EstimatedValue must be a valid non-negative number.'
    };
  }

  return {
    isValid: true,
    data: {
      assetName: String(AssetName).trim(),
      category: String(Category).trim(),
      serialNumber: String(SerialNumber).trim(),
      status: String(Status).trim(),
      estimatedValue: numericValue
    }
  };
}

// magdagdag ng bagong asset sa database
app.post('/api/assets', authenticateToken, async (req, res, next) => {
  try {
    const validation = validateAssetInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'ValidationError',
        message: validation.message
      });
    }

    const { assetName, category, serialNumber, status, estimatedValue } = validation.data;
    const pool = await getPool();

    // check muna if may kaparehas na serial number para iwas duplicate error
    const existing = await pool.request()
      .input('serialNumber', sql.NVarChar(100), serialNumber)
      .query('SELECT Id FROM Assets WHERE SerialNumber = @serialNumber');

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: `An asset with SerialNumber '${serialNumber}' already exists.`
      });
    }

    // insert gamit parameterized query tapos gamit OUTPUT INSERTED para makuha agad yung bagong record
    const result = await pool.request()
      .input('assetName', sql.NVarChar(100), assetName)
      .input('category', sql.NVarChar(50), category)
      .input('serialNumber', sql.NVarChar(100), serialNumber)
      .input('status', sql.NVarChar(50), status)
      .input('estimatedValue', sql.Decimal(18, 2), estimatedValue)
      .query(`
        INSERT INTO Assets (AssetName, Category, SerialNumber, Status, EstimatedValue)
        OUTPUT INSERTED.Id, INSERTED.AssetName, INSERTED.Category, INSERTED.SerialNumber, INSERTED.Status, INSERTED.EstimatedValue, INSERTED.CreatedAt
        VALUES (@assetName, @category, @serialNumber, @status, @estimatedValue)
      `);

    const newAsset = result.recordset[0];
    res.status(201).json(newAsset);
  } catch (err) {
    next(err);
  }
});

// update ng existing asset sa database
app.put('/api/assets/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // check muna kung valid positive integer yung id
    const assetId = parseInt(id, 10);
    if (isNaN(assetId) || assetId <= 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Asset ID must be a valid positive integer.'
      });
    }

    // gamitin yung shared validation helper
    const validation = validateAssetInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'ValidationError',
        message: validation.message
      });
    }

    const { assetName, category, serialNumber, status, estimatedValue } = validation.data;
    const pool = await getPool();

    // check kung existing yung i-uupdate na asset
    const checkAsset = await pool.request()
      .input('id', sql.Int, assetId)
      .query('SELECT Id FROM Assets WHERE Id = @id');

    if (checkAsset.recordset.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: `Asset with ID ${assetId} was not found.`
      });
    }

    // check kung may ibang asset na gumagamit na nung serial number na yun
    const duplicateCheck = await pool.request()
      .input('serialNumber', sql.NVarChar(100), serialNumber)
      .input('id', sql.Int, assetId)
      .query('SELECT Id FROM Assets WHERE SerialNumber = @serialNumber AND Id <> @id');

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: `An asset with SerialNumber '${serialNumber}' already exists.`
      });
    }

    // execute update tapos return updated row gamit OUTPUT INSERTED
    const result = await pool.request()
      .input('id', sql.Int, assetId)
      .input('assetName', sql.NVarChar(100), assetName)
      .input('category', sql.NVarChar(50), category)
      .input('serialNumber', sql.NVarChar(100), serialNumber)
      .input('status', sql.NVarChar(50), status)
      .input('estimatedValue', sql.Decimal(18, 2), estimatedValue)
      .query(`
        UPDATE Assets
        SET AssetName = @assetName,
            Category = @category,
            SerialNumber = @serialNumber,
            Status = @status,
            EstimatedValue = @estimatedValue
        OUTPUT INSERTED.Id, INSERTED.AssetName, INSERTED.Category, INSERTED.SerialNumber, INSERTED.Status, INSERTED.EstimatedValue, INSERTED.CreatedAt
        WHERE Id = @id
      `);

    res.status(200).json(result.recordset[0]);
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
