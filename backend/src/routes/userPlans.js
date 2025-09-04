const express = require('express');
const { requireAuth } = require('../middleware/auth');
const UserPlan = require('../models/UserPlan');

const router = express.Router();

// GET /api/user/plans - list active subscriptions of the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const listRaw = await UserPlan.find({ userId: req.user.sub, status: 'active' })
      .populate('planId', 'name')
      .sort({ endsAt: 1 })
      .lean();
    const list = listRaw.map((p) => {
      const { isRenewable, ...rest } = p;
      return rest;
    });
    res.json(list);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;



