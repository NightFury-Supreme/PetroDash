const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const User = require('../../models/User');
const Server = require('../../models/Server');
const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const Plan = require('../../models/Plan');
const UserPlan = require('../../models/UserPlan');

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      usersToday,
      totalServers,
      eggsCount,
      locationsCount,
      plansCount,
      totalPurchases,
      purchasesToday,
      usersWithPurchases
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      Server.countDocuments({}),
      Egg.countDocuments({}),
      Location.countDocuments({}),
      Plan.countDocuments({}),
      UserPlan.countDocuments({}),
      UserPlan.countDocuments({ createdAt: { $gte: startOfToday } }),
      UserPlan.distinct('userId').then(ids => ids.length)
    ]);

    // Servers per egg and per location
    const serversByEgg = await Server.aggregate([
      { $group: { _id: '$eggId', count: { $sum: 1 } } },
      { $lookup: { from: 'eggs', localField: '_id', foreignField: '_id', as: 'egg' } },
      { $unwind: { path: '$egg', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, eggId: '$_id', name: '$egg.name', count: 1 } }
    ]);

    const serversByLocation = await Server.aggregate([
      { $group: { _id: '$locationId', count: { $sum: 1 } } },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          locationId: '$_id',
          name: '$location.name',
          serverLimit: '$location.serverLimit',
          count: 1
        }
      }
    ]);

    return res.json({
      users: { total: totalUsers, today: usersToday },
      servers: { total: totalServers, byEgg: serversByEgg, byLocation: serversByLocation },
      eggs: { total: eggsCount },
      locations: { total: locationsCount },
      plans: { total: plansCount },
      purchases: { total: totalPurchases, today: purchasesToday, usersWithPurchases }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load admin stats' });
  }
});

module.exports = router;
