const express = require('express');
const Egg = require('../models/Egg');
const Server = require('../models/Server');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        const eggs = await Egg.find().lean();
        
        // Get server count for each egg
        const eggsWithCounts = await Promise.all(
            eggs.map(async (egg) => {
                const serverCount = await Server.countDocuments({ eggId: egg._id });
                return {
                    ...egg,
                    serverCount
                };
            })
        );

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




