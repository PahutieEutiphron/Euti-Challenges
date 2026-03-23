const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/v1/admin/dashboard
router.get('/dashboard', authenticate, requireRole('admin'), (req, res) => {
  res.json({
    dashboard: {
      totalUsers: db.users.count(),
      totalCreators: db.users.countByRole('creator'),
      totalRequests: db.requests.count(),
      pendingRequests: db.requests.countByStatus('pending'),
      platformVersion: '2.1.3',
      serverStatus: 'healthy'
    }
  });
});

// GET /api/v1/admin/users
router.get('/users', authenticate, requireRole('admin'), (req, res) => {
  const users = db.users.getAll().map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    address: u.address,
    phone: u.phone,
    created_at: u.created_at
  }));
  res.json({ users });
});

module.exports = router;
