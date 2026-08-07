const express = require('express');
 
const Plan = require('../models/Plan');
 
 
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
    const plansQuery = Plan.find({
      visibility: 'public',
      $and: [
        {
          $or: [
            { availableAt: { $lte: now } },
            { availableAt: { $exists: false } }
          ]
        },
        {
          $or: [
            { availableUntil: { $gt: now } },
            { availableUntil: { $exists: false } }
          ]
        },
        {
          $or: [
            { stock: { $gt: 0 } },
            { stock: 0 }
          ]
        }
      ]
    }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    
    // Optional pagination
    let plansRaw;
    
    // Fetch global currency for display
    const settings = await getSettings();
    const currency = settings?.localization?.currency || 'USD';
    
    if (paginate) {
      const [list, total] = await Promise.all([
        plansQuery.skip((page - 1) * pageSize).limit(pageSize),
        Plan.countDocuments({ visibility: 'public' })
      ]);
      plansRaw = list;
      // sanitize below; respond with meta
      const plans = plansRaw.map((p) => {
        // eslint-disable-next-line unused-imports/no-unused-vars
        const { staffNotes, totalPurchases, currentUsers, stock, limitPerCustomer, redirectionLink, billingOptions, ...rest } = p;
        return { ...rest, lifetime: Boolean(billingOptions?.lifetime), currency };
      });
      const responseData = { data: plans, meta: { total, page, pageSize } };
      await setCache(cacheKey, responseData, 60);
      return res.json(responseData);
    } else {
      plansRaw = await plansQuery;
    }
    
    // Sanitize public response: remove staff-only fields and flatten billingOptions.lifetime
    const plans = plansRaw.map((p) => {
      const {
        // eslint-disable-next-line unused-imports/no-unused-vars
        staffNotes,
        // eslint-disable-next-line unused-imports/no-unused-vars
        totalPurchases,
        // eslint-disable-next-line unused-imports/no-unused-vars
        currentUsers,
        // eslint-disable-next-line unused-imports/no-unused-vars
        stock,
        // eslint-disable-next-line unused-imports/no-unused-vars
        limitPerCustomer,
        // eslint-disable-next-line unused-imports/no-unused-vars
        redirectionLink,
        billingOptions,
        ...rest
      } = p;
      return {
        ...rest,
        lifetime: Boolean(billingOptions?.lifetime),
        currency,
      };
    });
    
    await setCache(cacheKey, plans, 60);
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});





module.exports = router;

