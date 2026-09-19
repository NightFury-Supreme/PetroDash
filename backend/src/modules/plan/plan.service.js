/**
 * Plan Service Layer
 * Optimized DB queries, strictly no N+1 queries, full Redis caching.
 */

const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');
require('../../models/PlanCategory'); // Ensure model is registered
const { getSettings } = require('../../lib/settings');
const { getCache, setCache } = require('../../lib/redis');

class PlanService {
  async getPublicPlans(paginate, page, pageSize) {
    const cacheKey = `api:plans:${paginate}:${page}:${pageSize}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const now = new Date();
    
    // DB Optimized query with strict limits and indexes
    const baseQuery = {
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
    };

    let plansQuery = Plan.find(baseQuery)
      .populate('category', 'name')
      .sort({ popular: -1, sortOrder: 1, createdAt: -1 })
      .lean();

    let plansRaw = [];
    let total = 0;

    if (paginate) {
      const [list, count] = await Promise.all([
        plansQuery.skip((page - 1) * pageSize).limit(pageSize),
        Plan.countDocuments({ visibility: 'public' })
      ]);
      plansRaw = list;
      total = count;
    } else {
      plansRaw = await plansQuery;
    }

    if (!plansRaw.length) {
      const emptyRes = paginate ? { data: [], meta: { total: 0, page, pageSize } } : [];
      return emptyRes;
    }

    // DB OPTIMIZATION: Eliminate N+1 loop for stock calculation
    const planIdsWithStock = plansRaw.filter(p => p.stock > 0).map(p => p._id);
    let stockCountsMap = {};

    if (planIdsWithStock.length > 0) {
      const activeCounts = await UserPlan.aggregate([
        { $match: { status: 'active', planId: { $in: planIdsWithStock } } },
        { $group: { _id: "$planId", count: { $sum: 1 } } }
      ]);
      activeCounts.forEach(ac => {
        stockCountsMap[ac._id.toString()] = ac.count;
      });
    }

    const settings = await getSettings();
    const currency = settings?.localization?.currency || 'USD';

    const plans = plansRaw.map(p => {
      let stockLeft = p.stock || 0;
      if (p.stock > 0) {
        const activeCount = stockCountsMap[p._id.toString()] || 0;
        stockLeft = Math.max(0, p.stock - activeCount);
      }

      // Hide internal admin notes and metrics securely
      const { staffNotes: _s, totalPurchases: _t, currentUsers: _c, limitPerCustomer: _l, redirectionLink: _r, billingOptions, ...safeData } = p;
      
      return { 
        ...safeData, 
        category: p.category && p.category.name ? p.category.name : (p.category || 'Others'),
        lifetime: Boolean(billingOptions?.lifetime), 
        currency,
        stockLeft 
      };
    });

    if (paginate) {
      const responseData = { data: plans, meta: { total, page, pageSize } };
      await setCache(cacheKey, responseData, 60);
      return responseData;
    }

    await setCache(cacheKey, plans, 60);
    return plans;
  }
}

module.exports = new PlanService();
