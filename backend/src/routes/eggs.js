const express = require('express');
const Egg = require('../models/Egg');
const Server = require('../models/Server');
const { requireAuth } = require('../middleware/auth');
const { getCache, setCache } = require('../lib/redis');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        let eggsWithCounts = await getCache('eggs:counts');
        
        if (!eggsWithCounts) {
            const eggs = await Egg.find().populate('category').lean();
            const Plan = require('../models/Plan');
            const allPlans = await Plan.find({}, '_id name').lean();
            const planMap = new Map();
            allPlans.forEach(p => {
                planMap.set(p._id.toString(), p.name);
                planMap.set(p.name, p.name);
            });
            
            // [ISO 25010 Performance] O(1) query instead of N+1
            const serverCountsAgg = await Server.aggregate([{ $group: { _id: '$eggId', count: { $sum: 1 } } }]);
            const serverCounts = new Map(serverCountsAgg.map(s => [s._id?.toString(), s.count]));

            eggsWithCounts = eggs.map((egg) => {
                const serverCount = serverCounts.get(egg._id.toString()) || 0;
                const allowedPlanNames = (egg.allowedPlans || [])
                    .map(ap => planMap.get(String(ap)))
                    .filter(Boolean);
                
                return {
                    ...egg,
                    categoryName: egg.category?.name || 'Uncategorized',
                    serverCount,
                    allowedPlanNames: [...new Set(allowedPlanNames)] // unique names
                };
            });
            
            // Cache for 5 minutes
            await setCache('eggs:counts', eggsWithCounts, 300);
        }

        // Mark isPlanAllowed based on active plans
        try {
            const UserPlan = require('../models/UserPlan');
            const active = await UserPlan.find({ userId: req.user.sub, status: 'active' }).populate('planId', 'name').lean();
            const tokens = new Set([
                ...active.map(p => p?.planId?.name).filter(Boolean),
                ...active.map(p => String(p?.planId?._id || '')).filter(Boolean),
            ]);
            const withFlag = eggsWithCounts.map((e) => ({
                ...e,
                isPlanAllowed: !Array.isArray(e.allowedPlans) || e.allowedPlans.length === 0 || e.allowedPlans.some((ap) => tokens.has(String(ap)))
            }));
            return res.json(withFlag);
         
        } catch (_) {
            return res.json(eggsWithCounts);
        }
    } catch (error) {
        console.error('Error fetching eggs with counts:', error);
        res.status(500).json({ error: 'Failed to fetch eggs' });
    }
});

module.exports = router;




