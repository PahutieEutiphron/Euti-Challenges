const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { getPrivateKey } = require('../utils/keys');
const { loginRateLimit, recordFailedAttempt, clearAttempts } = require('../middleware/rateLimit');

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    getPrivateKey(),
    { algorithm: 'RS256', expiresIn: '1h' }
  );
}

// POST /api/v1/auth/login
router.post('/login', loginRateLimit, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Validation error', message: 'Email and password are required.' });
  }

  const user = db.users.findByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    recordFailedAttempt(req._rateLimitIp);
    return res.status(401).json({ error: 'Authentication failed', message: 'Invalid email or password.' });
  }

  clearAttempts(req._rateLimitIp);
  const token = generateToken(user);

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
});

// POST /api/v1/auth/signup
router.post('/signup', (req, res) => {
  const { email, password, name, address, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Validation error', message: 'Email, password, and name are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Validation error', message: 'Please provide a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Validation error', message: 'Password must be at least 8 characters long.' });
  }

  if (db.users.findByEmail(email)) {
    return res.status(409).json({ error: 'Email taken', message: 'An account with this email already exists.' });
  }

  const newId = db.users.getNextId();
  const hashed = bcrypt.hashSync(password, 10);

  // Determine role based on request
  let role = 'user';
  if (req.body.isCreator === true) {
    role = 'creator';
  }

  // Check if there's a pending team invite for this email
  const invite = db.invites.findByEmail(email);
  if (invite) {
    role = invite.role;
    db.invites.deleteByEmail(email);
  }

  db.users.insert({
    id: newId,
    email,
    password: hashed,
    name,
    address: address || '',
    phone: phone || '',
    role
  });

  const token = generateToken({ id: newId, email, role, name });

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: {
      id: newId,
      email,
      name,
      role,
      isCreator: role === 'creator' || role === 'admin'
    }
  });
});

// POST /api/v1/auth/password-reset
router.post('/password-reset', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Validation error', message: 'Email is required.' });
  }

  const user = db.users.findByEmail(email);

  if (user) {
    return res.json({ message: 'Password reset link has been sent to your email address.' });
  } else {
    return res.status(404).json({
      error: 'Not found',
      message: 'There is no account associated with that email in our database.'
    });
  }
});

module.exports = router;
