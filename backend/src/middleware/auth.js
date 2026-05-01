const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from Firestore
    const userDoc = await db.collection('users').doc(decoded.id).get();
    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found. Token invalid.' });
    }

    const userData = userDoc.data();
    // Attach user to request (exclude passwordHash)
    req.user = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    console.error('Auth middleware error:', err);
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

module.exports = authMiddleware;
