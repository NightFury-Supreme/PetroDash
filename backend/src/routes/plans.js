const express = require('express');
 
const Plan = require('../models/Plan');
 
 
const Settings = require('../models/Settings');
 

const router = express.Router();

// GET /api/plans - list all public plans
router.get('/', async (req, res) => {
  try {
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
    const paginate = String(req.query.paginate || '').toLowerCase() === 'true';
    let page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
    let pageSize = Math.max(1, Math.min(100, parseInt(String(req.query.pageSize || '12')) || 12));
    let plansRaw;
    
    // Fetch global currency for display
    const settings = await Settings.findOne({}).lean();
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
      return res.json({ data: plans, meta: { total, page, pageSize } });
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
    res.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});



// Helper function to get billing cycle duration in milliseconds
// eslint-disable-next-line unused-imports/no-unused-vars
function getBillingCycleMs(cycle) {
  switch (cycle) {
    case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    case 'quarterly': return 90 * 24 * 60 * 60 * 1000;
    case 'semi-annual': return 180 * 24 * 60 * 60 * 1000;
    case 'annual': return 365 * 24 * 60 * 60 * 1000;
    default: return 30 * 24 * 60 * 60 * 1000;
  }
}

module.exports = router;

