const express = require('express');
 
const Plan = require('../models/Plan');
const UserPlan = require('../models/UserPlan');
 
const { getSettings } = require('../lib/settings');
const { getCache, setCache } = require('../lib/redis');

const router = express.Router();

// GET /api/plans - list all public plans
router.get('/', async (req, res) => {
  try {
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '12')) || 12));

    const cacheKey = `api:plans:${paginate}:${page}:${pageSize}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    require('../models/PlanCategory'); // Ensure model is registered
    const plansQuery = Plan.find({
      visibility: 'public',
      enabled: true,
      $and: [
        {
          $or: [
            { availableAt: { $lte: now } },
            { availableAt: { $exists: false } },
            { availableAt: null }
          ]
        },
        {
          $or: [
            { availableUntil: { $gt: now } },
            { availableUntil: { $exists: false } },
            { availableUntil: null }
          ]
        },
        {
          $or: [
            { stock: { $gt: 0 } },
            { stock: 0 },
            { stock: null }
          ]
        }
      ]
    }).populate('category', 'name').sort({ popular: -1, sortOrder: 1, createdAt: -1 }).lean();
    
    // Optional pagination
    let plansRaw;
    
    // Fetch global currency for display
    const settings = await getSettings();
    const currency = settings?.localization?.currency || 'USD';
    
    if (paginate) {
      const [list] = await Promise.all([
        plansQuery.skip((page - 1) * pageSize).limit(pageSize),
        Plan.countDocuments({ visibility: 'public' })
      ]);
      plansRaw = list;
    } else {
      plansRaw = await plansQuery;
    }
    
    // Add stockLeft calculations
    plansRaw = await Promise.all(plansRaw.map(async (p) => {
      if (p.stock > 0) {
        const activeCount = await UserPlan.countDocuments({ planId: p._id, status: 'active' });
        p.stockLeft = Math.max(0, p.stock - activeCount);
      }
      return p;
    }));

    const mapPlan = (p) => {
      const { staffNotes: _staffNotes, totalPurchases: _totalPurchases, currentUsers: _currentUsers, limitPerCustomer: _limitPerCustomer, redirectionLink: _redirectionLink, billingOptions, ...rest } = p;
      return { 
        ...rest, 
        category: p.category && p.category.name ? p.category.name : (p.category || 'Others'),
        lifetime: Boolean(billingOptions?.lifetime), 
        currency,
        stockLeft: p.stockLeft 
      };
    };

    if (paginate) {
      const plans = plansRaw.map(mapPlan);
      const responseData = { data: plans, meta: { total: await Plan.countDocuments({ visibility: 'public' }), page, pageSize } };
      await setCache(cacheKey, responseData, 60);
      return res.json(responseData);
    } else {
      const plans = plansRaw.map(mapPlan);
      await setCache(cacheKey, plans, 60);
      res.json(plans);
    }
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});





module.exports = router;

