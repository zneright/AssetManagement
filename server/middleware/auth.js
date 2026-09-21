import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  // check muna if may auth header na pinasa
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is missing.'
    });
  }

  // format dapat is Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization format. Format must be Bearer <token>.'
    });
  }

  const token = parts[1].trim();
  const secret = process.env.JWT_SECRET || 'fallback_secret_key';

  try {
    const decoded = jwt.verify(token, secret);
    // save sa request para magamit sa susunod na handlers
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired. Please login again.'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token.'
    });
  }
}
