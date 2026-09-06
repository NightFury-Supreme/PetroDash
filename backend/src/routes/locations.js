const express = require('express');

const Location = require('../models/Location');
const Server = require('../models/Server');
const { requireAuth } = require('../middleware/auth');
const { getCache, setCache } = require('../lib/redis');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        let locationsWithData = await getCache('api:locations');
        
        if (!locationsWithData) {
            const locations = await Location.find().lean();
            const Plan = require('../models/Plan');
            const allPlans = await Plan.find({}, '_id name').lean();
            const planMap = new Map();
            allPlans.forEach(p => {
                planMap.set(p._id.toString(), p.name);
                planMap.set(p.name, p.name);
            });
            
            // Get server count and ping for each location
            locationsWithData = await Promise.all(
                locations.map(async (location) => {
                    const serverCount = await Server.countDocuments({ locationId: location._id });
                    
                    // Get ping from Redis cache (populated by pingWorker)
                    const cacheData = await getCache(`ping:${location._id}`);
                    const ping = cacheData ? cacheData.ping : null;
                    
                    const allowedPlanNames = (location.allowedPlans || [])
                        .map(ap => planMap.get(String(ap)))
                        .filter(Boolean);

                    return {
                        ...location,
                        serverCount,
                        ping,
                        allowedPlanNames: [...new Set(allowedPlanNames)] // unique names
                    };
                })
            );
            
            await setCache('api:locations', locationsWithData, 60);
        }
        
        // Mark isPlanAllowed based on active plans
        try {
            const UserPlan = require('../models/UserPlan');
            const active = await UserPlan.find({ userId: req.user.sub, status: 'active' }).populate('planId', 'name').lean();
            const tokens = new Set([
                ...active.map(p => p?.planId?.name).filter(Boolean),
                ...active.map(p => String(p?.planId?._id || '')).filter(Boolean),
            ]);
            const withFlag = locationsWithData.map((l) => ({
                ...l,
                isPlanAllowed: !Array.isArray(l.allowedPlans) || l.allowedPlans.length === 0 || l.allowedPlans.some((ap) => tokens.has(String(ap)))
            }));
            return res.json(withFlag);
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {
            return res.json(locationsWithData);
        }
    } catch (error) {
        console.error('Error fetching locations with data:', error);
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

module.exports = router;




