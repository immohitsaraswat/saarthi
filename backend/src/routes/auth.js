const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper: generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper: format user response (strip sensitive fields)
const formatUser = (id, data) => ({
  id,
  name: data.name,
  email: data.email,
  createdAt: data.createdAt,
  // null = existing user (no onboarding field) → skip checklist
  // object = new user → show checklist
  onboarding: data.onboarding ?? null,
  preferences: data.preferences || { defaultPriority: 'medium' },
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!existingUser.empty) {
        return res.status(400).json({ message: 'Email already registered.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user document
      const userRef = db.collection('users').doc();
      const userData = {
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
        onboarding: { createdProject: false, createdTask: false, invitedMember: false },
        preferences: { defaultPriority: 'medium' },
      };

      await userRef.set(userData);

      const token = generateToken(userRef.id);

      return res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: formatUser(userRef.id, userData),
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const snapshot = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      const isMatch = await bcrypt.compare(password, userData.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = generateToken(userDoc.id);

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: formatUser(userDoc.id, userData),
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error during login.' });
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: formatUser(userDoc.id, userDoc.data()) });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────
// PUT /api/auth/me  — update profile / preferences
// ─────────────────────────────────────────────
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const updates = { updatedAt: new Date().toISOString() };
    if (name && typeof name === 'string') updates.name = name.trim();
    if (preferences && typeof preferences === 'object') updates.preferences = preferences;

    await db.collection('users').doc(req.user.id).update(updates);
    const userDoc = await db.collection('users').doc(req.user.id).get();
    return res.status(200).json({ user: formatUser(userDoc.id, userDoc.data()) });
  } catch (err) {
    console.error('Update me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
