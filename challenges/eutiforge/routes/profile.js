const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/profile
router.get('/', authenticate, (req, res) => {
  const user = db.users.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'Not found', message: 'User not found.' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      address: user.address,
      phone: user.phone,
      role: user.role,
      created_at: user.created_at
    }
  });
});

// PUT /api/v1/profile/password
router.put('/password', authenticate, (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'Validation error', message: 'New password and confirmation are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'Validation error', message: 'Passwords do not match.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Validation error', message: 'Password must be at least 8 characters long.' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.users.updatePassword(req.user.userId, hashed);

  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;
