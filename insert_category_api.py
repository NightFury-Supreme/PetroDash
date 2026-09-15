import sys

def insert_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    injection = """
// ==========================================
// PLAN CATEGORIES API
// ==========================================
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const { getCache, setCache } = require('../../lib/redis');
    const cached = await getCache('admin:plans:categories');
    if (cached) return res.json(cached);

    const PlanCategory = require('../../models/PlanCategory');
    const Plan = require('../../models/Plan');
    const mongoose = require('mongoose');

    // Auto-migrate string categories to ObjectIds
    const rawPlans = await mongoose.connection.db.collection('plans').find({ category: { $type: 'string' } }).toArray();
    for (const raw of rawPlans) {
      if (raw.category && raw.category !== 'Others') {
        const cat = await PlanCategory.findOneAndUpdate(
          { name: raw.category },
          { $setOnInsert: { name: raw.category } },
          { upsert: true, new: true }
        );
        await mongoose.connection.db.collection('plans').updateOne(
          { _id: raw._id },
          { $set: { category: cat._id } }
        );
      } else if (raw.category === 'Others') {
        const cat = await PlanCategory.findOneAndUpdate(
          { name: 'Others' },
          { $setOnInsert: { name: 'Others' } },
          { upsert: true, new: true }
        );
        await mongoose.connection.db.collection('plans').updateOne(
          { _id: raw._id },
          { $set: { category: cat._id } }
        );
      }
    }

    const categories = await PlanCategory.find().sort({ name: 1 }).lean();

    // Calculate counts
    const counts = await Plan.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    const countMap = counts.reduce((acc, curr) => {
      if (curr._id) acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const result = categories.map(c => ({
      id: c._id.toString(),
      name: c.name,
      planCount: countMap[c._id.toString()] || 0
    }));

    await setCache('admin:plans:categories', result, 60);
    res.json(result);
  } catch (error) {
    console.error('Error fetching plan categories:', error);
    res.status(500).json({ error: 'Failed to fetch plan categories' });
  }
});

router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const cat = await PlanCategory.create({ name: name.trim() });
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans:categories');
    await deleteCachePattern('admin:plans');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.plan_category.create', 'plan_category', cat._id.toString(), { created: { name: cat.name } });

    res.status(201).json({ id: cat._id.toString(), name: cat.name, planCount: 0 });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    console.error('Error creating plan category:', error);
    res.status(500).json({ error: 'Failed to create plan category' });
  }
});

router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Valid name is required' });
    }

    const cat = await PlanCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const oldName = cat.name;
    const newName = name.trim();
    if (oldName !== newName) {
      cat.name = newName;
      await cat.save();
      
      const { deleteCachePattern } = require('../../lib/redis');
      await deleteCachePattern('admin:plans:categories');
      await deleteCachePattern('admin:plans');
    }

    res.json({ id: cat._id.toString(), name: cat.name });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    console.error('Error updating plan category:', error);
    res.status(500).json({ error: 'Failed to update plan category' });
  }
});

router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const PlanCategory = require('../../models/PlanCategory');
    const Plan = require('../../models/Plan');
    
    const cat = await PlanCategory.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const count = await Plan.countDocuments({ category: cat._id });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete category with plans assigned to it' });

    await cat.deleteOne();
    
    const { deleteCachePattern } = require('../../lib/redis');
    await deleteCachePattern('admin:plans:categories');
    await deleteCachePattern('admin:plans');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.plan_category.delete', 'plan_category', cat._id.toString(), { name: cat.name });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan category:', error);
    res.status(500).json({ error: 'Failed to delete plan category' });
  }
});
// ==========================================

"""
    content = content.replace("// GET /api/admin/plans - List all plans", injection + "\n// GET /api/admin/plans - List all plans")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

insert_in_file('backend/src/routes/admin/plans.js')
