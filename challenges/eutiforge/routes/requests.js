const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/requests
router.post('/', authenticate, (req, res) => {
  const { creatorId, title, description, budget } = req.body;

  const userId = req.body.userId !== undefined ? req.body.userId : req.user.userId;

  if (!creatorId || !title) {
    return res.status(400).json({ error: 'Validation error', message: 'Creator and title are required.' });
  }

  const creators = db.users.getCreators();
  const creator = creators.find(c => c.id === creatorId);
  if (!creator) {
    return res.status(404).json({ error: 'Not found', message: 'Creator not found.' });
  }

  const targetUser = db.users.findById(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Not found', message: 'User not found.' });
  }

  // Creators and admins cannot be targeted as requesters
  if (targetUser.role === 'creator' || targetUser.role === 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have the permissions to perform this action.'
    });
  }

  const inserted = db.requests.insert({
    user_id: userId,
    creator_id: creatorId,
    title,
    description: description || '',
    budget: budget || ''
  });

  res.status(201).json({
    message: 'Request submitted successfully',
    request: {
      id: inserted.id,
      userId: targetUser.id,
      userName: targetUser.name,
      userEmail: targetUser.email,
      userAddress: targetUser.address,
      userPhone: targetUser.phone,
      creatorId: creator.id,
      creatorName: creator.name,
      title,
      description: description || '',
      budget: budget || '',
      status: 'pending'
    }
  });
});

// GET /api/v1/requests
router.get('/', authenticate, (req, res) => {
  const requests = db.requests.findByUserId(req.user.userId);

  const enriched = requests.map(r => {
    const creator = db.users.findById(r.creator_id);
    return {
      ...r,
      creator_name: creator ? creator.name : 'Unknown'
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ requests: enriched });
});

// GET /api/v1/requests/:requestId
router.get('/:requestId', authenticate, (req, res) => {
  const requestId = Number(req.params.requestId);

  const request = db.requests.findById(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Not found', message: 'Request not found.' });
  }

  const user = db.users.findById(request.user_id);
  const creator = db.users.findById(request.creator_id);

  res.json({
    request: {
      ...request,
      user_name: user ? user.name : 'Unknown',
      user_email: user ? user.email : 'Unknown',
      user_address: user ? user.address : '',
      user_phone: user ? user.phone : '',
      creator_name: creator ? creator.name : 'Unknown',
      creator_email: creator ? creator.email : 'Unknown'
    }
  });
});

module.exports = router;
