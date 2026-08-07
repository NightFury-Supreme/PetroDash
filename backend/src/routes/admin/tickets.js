const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../../models/Ticket');
const Settings = require('../../models/Settings');
const { requireAdmin } = require('../../middleware/auth');
const { getCache, setCache, deleteCachePattern } = require('../../lib/redis');
const { getSettings, clearSettingsCache } = require('../../lib/settings');

const router = express.Router();

function extractAdminId(req) {
  return (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
}

// GET /api/admin/tickets — list with server-side search + pagination
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { q, status, priority, deleted, page = '1', limit = '25' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const query = {};
    if (deleted === '1' || deleted === 'true') {
      query.deletedByUser = true;
    } else if (deleted !== 'all') {
      query.deletedByUser = { $ne: true };
    }
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      query.status = { $eq: status };
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      query.priority = { $eq: priority };
    }
    if (q && typeof q === 'string' && q.trim()) {
      // Escape regex special chars to prevent injection
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { tags: { $elemMatch: { $regex: escaped, $options: 'i' } } },
        { category: { $regex: escaped, $options: 'i' } }
      ];
    }

    const cacheKey = `tickets:admin:list:${q || ''}:${status || ''}:${priority || ''}:${deleted || ''}:${pageNum}:${limitNum}`;
    const cachedTickets = await getCache(cacheKey);
    if (cachedTickets) {
      return res.json(cachedTickets);
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .select('-messages') // exclude messages in list view for performance
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username email')
      .lean();

    const responseData = { tickets, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    await setCache(cacheKey, responseData, 30); // Cache for 30 seconds

    res.json(responseData);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

// GET /api/admin/tickets/:id — full ticket with messages
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const cacheKey = `tickets:admin:detail:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const t = await Ticket.findById(req.params.id)
      .populate('user', 'username email')
      .populate('messages.author', 'username email')
      .lean();
    if (!t) return res.status(404).json({ error: 'Not found' });

    await setCache(cacheKey, t, 30);
    res.json(t);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to load ticket' });
  }
});

// POST /api/admin/tickets/:id/messages — add a reply (public or internal note)
router.post('/:id/messages', requireAdmin, async (req, res) => {
  try {
    const adminId = extractAdminId(req);
    const { body, internal } = req.body || {};
    if (!body || typeof body !== 'string' || !body.trim())
      return res.status(400).json({ error: 'Message body required' });
    if (body.trim().length > 5000)
      return res.status(400).json({ error: 'Message cannot exceed 5000 characters' });
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const t = await Ticket.findById(req.params.id).populate('messages.author', 'username email');
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });

    const isInternal = !!internal;
    t.messages.push({ body: body.trim(), author: adminId, authorRole: 'admin', internal: isInternal });
    t.updatedAt = new Date();
    if (!isInternal) t.lastAdminReplyAt = new Date();
    await t.save();

    // Notify ticket owner on public reply (non-blocking)
    if (!isInternal) {
      try {
        const User = require('../../models/User');
        const owner = await User.findById(t.user).lean();
        if (owner && owner.email) {
          const { sendMailTemplate } = require('../../lib/mail');
          await sendMailTemplate({
            to: owner.email,
            templateKey: 'ticketReply',
            data: { title: t.title, snippet: String(body).slice(0, 200) }
          });
        }
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    }

    // Invalidate caches
    await deleteCachePattern('tickets:admin:list:*');
    await deleteCachePattern(`tickets:mine:${t.user}:*`);
    await deleteCachePattern(`tickets:admin:detail:${req.params.id}`);

    const savedMsg = t.messages[t.messages.length - 1];
    res.json({ ok: true, message: savedMsg });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// PATCH /api/admin/tickets/:id — update status / priority / assignee / tags (only update provided fields)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const { status, assignee, priority, tags, deletedByUser } = req.body || {};
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });

    let changed = false;
    if (status !== undefined && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      if (t.status === 'closed' && status === 'resolved') {
        return res.status(400).json({ error: 'Cannot resolve a closed ticket. Please reopen it first.' });
      }
      t.status = status;
      if (status === 'closed') t.closedAt = t.closedAt || new Date();
      changed = true;
    }
    if (priority !== undefined && ['low', 'medium', 'high'].includes(priority)) {
      t.priority = priority;
      changed = true;
    }
    if (assignee !== undefined) {
      t.assignee = assignee ? new mongoose.Types.ObjectId(String(assignee)) : null;
      changed = true;
    }
    if (Array.isArray(tags)) {
      t.tags = tags.slice(0, 20);
      changed = true;
    }
    if (typeof deletedByUser === 'boolean') {
      t.deletedByUser = deletedByUser;
      changed = true;
    }

    if (changed) {
      t.updatedAt = new Date();
      await t.save();
      
      // Invalidate caches
      await deleteCachePattern('tickets:admin:list:*');
      await deleteCachePattern(`tickets:mine:${t.user}:*`);
      await deleteCachePattern(`tickets:admin:detail:${req.params.id}`);
    }

    res.json({ ok: true, status: t.status, priority: t.priority });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// DELETE /api/admin/tickets/:id — hard delete (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    const result = await Ticket.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    
    // Invalidate caches
    await deleteCachePattern('tickets:admin:list:*');
    if (result.user) await deleteCachePattern(`tickets:mine:${result.user}:*`);
    await deleteCachePattern(`tickets:admin:detail:${req.params.id}`);
    
    res.json({ ok: true });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// GET /api/admin/tickets/settings/categories
router.get('/settings/categories', requireAdmin, async (req, res) => {
  try {
    const s = await getSettings();
    const categories = (s && Array.isArray(s.ticketCategories) ? s.ticketCategories : []);
    res.json({ categories });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/admin/tickets/settings/categories/usage
router.get('/settings/categories/usage', requireAdmin, async (req, res) => {
  try {
    const agg = await Ticket.aggregate([
      { $match: { category: { $type: 'string', $gt: '' }, deletedByUser: { $ne: true } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const usage = {};
    for (const row of agg) usage[row._id] = row.count;
    res.json({ usage });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to load usage' });
  }
});

// PATCH /api/admin/tickets/settings/categories
router.patch('/settings/categories', requireAdmin, async (req, res) => {
  try {
    let { categories } = req.body || {};
    if (!Array.isArray(categories))
      return res.status(400).json({ error: 'categories must be an array of strings' });
    categories = categories
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter((c) => c)
      .map((c) => c.slice(0, 50));
    if (categories.length === 0) categories = ['general'];
    const newSet = Array.from(new Set(categories));

    const existingSettings = await Settings.findOne({});
    const current = (existingSettings && Array.isArray(existingSettings.ticketCategories))
      ? existingSettings.ticketCategories : [];
    const toRemove = current.filter((c) => !newSet.includes(c));
    if (toRemove.length > 0) {
      const inUse = await Ticket.distinct('category', { category: { $in: toRemove } });
      if (inUse.length > 0)
        return res.status(400).json({ error: 'Cannot remove categories that are in use', inUse });
    }

    let s = existingSettings;
    if (!s) s = await Settings.create({});
    s.ticketCategories = newSet;
    await s.save();
    clearSettingsCache();
    res.json({ ok: true, categories: s.ticketCategories });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to update categories' });
  }
});

module.exports = router;
