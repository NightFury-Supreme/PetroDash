const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../../models/Ticket');
const Settings = require('../../models/Settings');
const { requireAdmin } = require('../../middleware/auth');

const router = express.Router();

// List tickets with filters
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { q, status, priority, deleted } = req.query;
    const query = {};
    if (deleted === '1' || deleted === 'true') query.deletedByUser = true;
    if (status && ['open','pending','resolved','closed'].includes(status)) {
      query.status = { $eq: status };
    }
    if (priority && ['low','medium','high'].includes(priority)) {
      query.priority = { $eq: priority };
    }
    if (q && typeof q === 'string' && q.trim()) {
      // Escape special regex characters to prevent NoSQL injection
      const escapedQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedQuery, $options: 'i' } },
        { tags: { $elemMatch: { $regex: escapedQuery, $options: 'i' } } }
      ];
    }
    const items = await Ticket.find(query)
      .sort({ updatedAt: -1 })
      .populate('user', 'username email')
      .lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

// Admin: get ticket detail with populated user and authors
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id)
      .populate('user', 'username email')
      .populate('messages.author', 'username email');
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ticket' });
  }
});

// Admin add message (public or internal) if not deleted
router.post('/:id/messages', requireAdmin, async (req, res) => {
  try {
    const { body, internal } = req.body || {};
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ error: 'Message body required' });
    }
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });
    const adminId = (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || undefined;
    t.messages.push({ body: body.trim(), author: adminId, internal: !!internal });
    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Update ticket status/assignee/priority/tags
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status, assignee, priority, tags, deletedByUser } = req.body || {};
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (status && ['open','pending','resolved','closed'].includes(status)) t.status = status;
    if (priority && ['low','medium','high'].includes(priority)) t.priority = priority;
    if (assignee) t.assignee = new mongoose.Types.ObjectId(String(assignee));
    if (Array.isArray(tags)) t.tags = tags.slice(0, 20);
    if (typeof deletedByUser === 'boolean') t.deletedByUser = deletedByUser;
    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Add internal admin note
router.post('/:id/notes', requireAdmin, async (req, res) => {
  try {
    const adminId = (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    const { body } = req.body || {};
    if (!body || typeof body !== 'string' || body.trim().length < 1) {
      return res.status(400).json({ error: 'Note required' });
    }
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    t.messages.push({ author: adminId, body: body.trim(), internal: true });
    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Ticket Categories - list
router.get('/settings/categories', requireAdmin, async (req, res) => {
  try {
    const s = await Settings.findOne({}).lean();
    const categories = (s && Array.isArray(s.ticketCategories) ? s.ticketCategories : []);
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Category usage counts to control deletability in UI
router.get('/settings/categories/usage', requireAdmin, async (req, res) => {
  try {
    const agg = await Ticket.aggregate([
      { $match: { category: { $type: 'string', $ne: null, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const usage = {};
    for (const row of agg) usage[row._id] = row.count;
    res.json({ usage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load usage' });
  }
});

// Ticket Categories - update
router.patch('/settings/categories', requireAdmin, async (req, res) => {
  try {
    let { categories } = req.body || {};
    if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array of strings' });
    categories = categories
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter((c) => c)
      .map((c) => c.slice(0, 50));
    // Ensure at least one category exists
    if (categories.length === 0) categories = ['general'];
    const newSet = Array.from(new Set(categories));

    // Prevent removing categories that are currently used by tickets
    const existingSettings = await Settings.findOne({});
    const current = (existingSettings && Array.isArray(existingSettings.ticketCategories)) ? existingSettings.ticketCategories : [];
    const toRemove = current.filter((c) => !newSet.includes(c));
    if (toRemove.length > 0) {
      const inUse = await Ticket.distinct('category', { category: { $in: toRemove } });
      if (inUse.length > 0) {
        return res.status(400).json({ error: 'Cannot remove categories that are in use', inUse });
      }
    }

    let s = existingSettings;
    if (!s) s = await Settings.create({});
    s.ticketCategories = newSet;
    await s.save();
    res.json({ ok: true, categories: s.ticketCategories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update categories' });
  }
});

module.exports = router;



