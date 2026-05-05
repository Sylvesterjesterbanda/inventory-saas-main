const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers['authorization'];

    console.log('Header received:', authHeader); // for debugging

    // If no header at all
    if (!authHeader) {
      return res.status(401).json({
        error: 'No token provided'
      });
    }

    // Header looks like "Bearer mytoken123"
    // Split by space to get just the token part
    const token = authHeader.split(' ')[1];

    console.log('Token extracted:', token); // for debugging

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded:', decoded); // for debugging

    // Attach user info to the request
    req.user = {
      userId: decoded.userId,
      companyId: decoded.companyId
    };

    // Move on to the actual route
    next();

  } catch (error) {
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }

    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;