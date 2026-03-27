const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const {
  db,
  createUser,
  getUserByEmail,
  getUserById,
  getUserWithPasswordByEmail,
  updateUserById,
} = require('../db');

const router = express.Router();
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const createToken = (user) =>
  jwt.sign({ id: user._id || user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (password = '') =>
  password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    age,
    weight,
    height,
    fitnessGoal,
    activityLevel,
    location,
    preferences,
  } = req.body;

  try {
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      age,
      weight,
      height,
      fitnessGoal,
      activityLevel,
      location,
      preferences,
    });

    return res.status(201).json({
      token: createToken(user),
      user,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ error: 'Please provide valid login credentials.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = getUserWithPasswordByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.lock_until && new Date(user.lock_until).getTime() > Date.now()) {
      const waitMinutes = Math.ceil((new Date(user.lock_until).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        error: `Too many failed attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? '' : 's'}.`,
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      const failedLoginAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      let storedAttempts = failedLoginAttempts;

      if (failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        lockUntil = new Date(Date.now() + LOCK_TIME_MS).toISOString();
        storedAttempts = 0;
      }

      db.prepare(
        'UPDATE users SET failed_login_attempts = ?, lock_until = ? WHERE id = ?',
      ).run(storedAttempts, lockUntil, user.id);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    db.prepare(
      'UPDATE users SET failed_login_attempts = 0, lock_until = NULL, last_login_at = ? WHERE id = ?',
    ).run(new Date().toISOString(), user.id);

    const sanitizedUser = getUserById(user.id);

    return res.json({
      token: createToken(sanitizedUser),
      user: sanitizedUser,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'age',
      'weight',
      'height',
      'fitnessGoal',
      'activityLevel',
      'location',
      'preferences',
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );

    const user = updateUserById(req.user.id, updates);

    return res.json(user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
