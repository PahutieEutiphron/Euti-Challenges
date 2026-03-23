const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/v1/creators
router.get('/', authenticate, (req, res) => {
  res.json({ creators: db.users.getCreators() });
});

// GET /api/v1/creators/search?q=
router.get('/search', authenticate, (req, res) => {
  const query = req.query.q || '';

  if (!query) {
    return res.json({ creators: db.users.getCreators(), query: '' });
  }

  const creators = db.users.searchCreators(query);

  if (creators.length === 0) {
    return res.json({
      creators: [],
      query: query,
      message: `We couldn't find any creators matching "${query}"`
    });
  }

  res.json({ creators, query });
});

// GET /api/v1/creators/dashboard
router.get('/dashboard', authenticate, requireRole('creator', 'admin'), (req, res) => {
  const requests = db.requests.findByCreatorId(req.user.userId);

  const enriched = requests.map(r => {
    const requester = db.users.findById(r.user_id);
    return {
      ...r,
      requester_name: requester ? requester.name : 'Unknown',
      requester_email: requester ? requester.email : 'Unknown'
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ requests: enriched });
});

// POST /api/v1/creators/requests/:id/respond
router.post('/requests/:id/respond', authenticate, requireRole('creator', 'admin'), (req, res) => {
  const { status } = req.body;
  const requestId = Number(req.params.id);

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status', message: 'Status must be "accepted" or "declined".' });
  }

  const updated = db.requests.updateStatus(requestId, req.user.userId, status);
  if (!updated) {
    return res.status(404).json({ error: 'Not found', message: 'Request not found.' });
  }

  res.json({ message: `Request has been ${status}.`, requestId, status });
});

// POST /api/v1/creators/invite
router.post('/invite', authenticate, requireRole('creator', 'admin'), (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Validation error', message: 'Email is required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Validation error', message: 'Please provide a valid email address.' });
  }

  const role = req.body.role || 'creator';

  // Check if already invited
  const existingInvite = db.invites.findByEmail(email);
  if (existingInvite) {
    return res.status(409).json({
      error: 'Already invited',
      message: `You've already invited ${email} to join your team.`
    });
  }

  const existingUser = db.users.findByEmail(email);

  if (existingUser) {
    return res.json({
      email: existingUser.email,
      role: role,
      message: 'Team member has been added successfully.'
    });
  }

  // Store pending invite — when this email signs up, they get this role
  db.invites.insert({ email, role, invited_by: req.user.userId });

  res.json({
    email,
    role: role,
    message: `No account found with that email. They can create an account using ${email} and will be automatically added to your team.`
  });
});

module.exports = router;
