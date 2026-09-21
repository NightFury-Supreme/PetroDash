const Egg = require('../../../models/Egg');
const EggCategory = require('../../../models/EggCategory');
const Server = require('../../../models/Server');
const Plan = require('../../../models/Plan');
const mongoose = require('mongoose');
const { getCache, setCache, deleteCachePattern } = require('../../../lib/redis');
const AppError = require('../../../utils/AppError');

exports.getEggsList = async () => {
    const cached = await getCache('admin:eggs:with-count');
    if (cached) return cached;

    const [eggs, serverCountsAgg, allPlans] = await Promise.all([
        Egg.find().populate('category').sort({ createdAt: -1 }).lean(),
        Server.aggregate([{ $group: { _id: '$eggId', count: { $sum: 1 } } }]),
        Plan.find({}, '_id name').lean()
    ]);
    
    const serverCounts = new Map(serverCountsAgg.map(s => [s._id?.toString(), s.count]));
    const planMap = new Map();
    allPlans.forEach(p => {
        planMap.set(p._id.toString(), p.name);
        planMap.set(p.name, p.name);
    });

    const list = eggs.map((egg) => {
        const count = serverCounts.get(egg._id.toString()) || 0;
        const allowedPlanNames = (egg.allowedPlans || [])
            .map(ap => planMap.get(String(ap)))
            .filter(Boolean);

        return { 
            ...egg, 
            categoryName: egg.category?.name || 'Uncategorized',
            category: egg.category?._id?.toString() || egg.category,
            serversCount: count,
            allowedPlanNames: [...new Set(allowedPlanNames)]
        };
    });

    await setCache('admin:eggs:with-count', list, 30);
    return list;
};

exports.createEgg = async (data) => {
    const egg = await Egg.create(data);
    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern('eggs:*');
    return egg;
};

exports.getEggCategories = async () => {
    const cached = await getCache('admin:eggs:categories');
    if (cached) return cached;

    const rawEggs = await mongoose.connection.db.collection('eggs').find({ category: { $type: 'string' } }).toArray();
    for (const raw of rawEggs) {
        if (raw.category) {
            const cat = await EggCategory.findOneAndUpdate(
                { name: raw.category }, 
                { $setOnInsert: { name: raw.category } }, 
                { upsert: true, new: true }
            );
            await mongoose.connection.db.collection('eggs').updateOne(
                { _id: raw._id }, 
                { $set: { category: cat._id } }
            );
        }
    }

    const categories = await EggCategory.find().sort({ name: 1 }).lean();
    
    const counts = await Egg.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc, curr) => {
        if (curr._id) acc[curr._id.toString()] = curr.count;
        return acc;
    }, {});

    const result = categories.map(c => ({
        id: c._id.toString(),
        name: c.name,
        eggCount: countMap[c._id.toString()] || 0
    }));

    await setCache('admin:eggs:categories', result, 60);
    return result;
};

exports.createEggCategory = async (name) => {
    try {
        const cat = await EggCategory.create({ name: name.trim() });
        await deleteCachePattern('admin:eggs:categories');
        await deleteCachePattern('eggs:*');
        return { id: cat._id.toString(), name: cat.name, eggCount: 0, catObj: cat };
    } catch (e) {
        if (e.code === 11000) throw new AppError('Category already exists', 400, 'ERR_DUPLICATE');
        throw new AppError('Internal error', 500, 'ERR_INTERNAL');
    }
};

exports.updateEggCategory = async (id, name) => {
    const cat = await EggCategory.findById(id);
    if (!cat) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');

    const oldName = cat.name;
    const newName = name.trim();
    if (oldName === newName) return { cat, oldName, newName, changed: false };

    cat.name = newName;
    await cat.save();

    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern('eggs:*');

    return { cat, oldName, newName, changed: true };
};

exports.deleteEggCategory = async (id) => {
    const cat = await EggCategory.findById(id);
    if (!cat) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');

    const count = await Egg.countDocuments({ category: cat._id });
    if (count > 0) throw new AppError('Cannot delete category with eggs', 400, 'ERR_BAD_REQUEST');

    await cat.deleteOne();
    await deleteCachePattern('admin:eggs:categories');
    await deleteCachePattern('eggs:*');

    return cat;
};

exports.getEggById = async (id) => {
    const cacheKey = `admin:egg:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const egg = await Egg.findById(id).populate('category').lean();
    if (!egg) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');

    const serversCount = await Server.countDocuments({ eggId: id });

    const formattedEgg = {
        ...egg,
        categoryName: egg.category?.name || 'Uncategorized',
        category: egg.category?._id?.toString() || egg.category,
        serversCount,
    };

    await setCache(cacheKey, formattedEgg, 30);
    return formattedEgg;
};

exports.updateEgg = async (id, data) => {
    const original = await Egg.findById(id).lean();
    if (!original) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');

    const egg = await Egg.findByIdAndUpdate(id, data, { new: true }).lean();

    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern('eggs:*');
    await deleteCachePattern(`admin:egg:${id}`);

    const changes = {};
    for (const [k, v] of Object.entries(data)) {
        if (JSON.stringify(original[k]) !== JSON.stringify(v)) changes[k] = { old: original[k], new: v };
    }

    return { egg, changes };
};

exports.deleteEgg = async (id) => {
    const serversCount = await Server.countDocuments({ eggId: id });
    if (serversCount > 0) {
        throw new AppError('Cannot delete egg with existing servers', 400, 'ERR_BAD_REQUEST');
    }

    const egg = await Egg.findByIdAndDelete(id).lean();
    if (!egg) throw new AppError('Not found', 404, 'ERR_NOT_FOUND');

    await deleteCachePattern('admin:eggs*');
    await deleteCachePattern('eggs:*');
    await deleteCachePattern(`admin:egg:${id}`);

    return egg;
};
