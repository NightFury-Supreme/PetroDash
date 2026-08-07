const express = require('express');
const { requireAuth } = require('../middleware/auth');
const UserPlan = require('../models/UserPlan');

const router = express.Router();

const { getCache, setCache } = require('../lib/redis');

// GET /api/user/plans - list active subscriptions of the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const cacheKey = `user:${req.user.sub}:plans`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const listRaw = await UserPlan.find({ userId: req.user.sub, status: 'active' })
      .populate('planId', 'name')
      .sort({ endsAt: 1 })
      .lean();
    const list = listRaw.map((p) => {
      // eslint-disable-next-line unused-imports/no-unused-vars
      const { isRenewable, ...rest } = p;
      return rest;
    });
    
    await setCache(cacheKey, list, 30);
    res.json(list);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;



