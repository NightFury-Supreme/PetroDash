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
    const { q, status, priority, category, deleted, sort = 'updated_desc', page = '1', limit = '25' } = req.query;
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
    if (category && typeof category === 'string' && category.trim()) {
      query.category = { $regex: category.trim(), $options: 'i' };
    }
    if (q && typeof q === 'string' && q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { tags: { $elemMatch: { $regex: escaped, $options: 'i' } } },
        { category: { $regex: escaped, $options: 'i' } }
      ];
    }

    // Sort mapping
    let sortObj = {};
    switch (sort) {
      case 'updated_asc':  sortObj = { updatedAt: 1 };  break;
      case 'created_desc': sortObj = { createdAt: -1 }; break;
      case 'created_asc':  sortObj = { createdAt: 1 };  break;
      case 'priority_desc': sortObj = { priority: -1, updatedAt: -1 }; break;
      case 'priority_asc':  sortObj = { priority: 1,  updatedAt: -1 }; break;
      default: sortObj = { updatedAt: -1 }; // updated_desc
    }

    const cacheKey = `tickets:admin:list:${q||''}:${status||''}:${priority||''}:${category||''}:${deleted||''}:${sort}:${pageNum}:${limitNum}`;
    const cachedTickets = await getCache(cacheKey);
    if (cachedTickets) {
      return res.json(cachedTickets);
    }

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .select('-messages')
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'username email')
      .lean();

    const responseData = { tickets, total, page: pageNum, pages: Math.ceil(total / limitNum) };
    await setCache(cacheKey, responseData, 30);

    res.json(responseData);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to list tickets' });
  }
});

// GET /api/admin/tickets/:id/messages — paginated messages (includes internal notes)
router.get('/:id/messages', requireAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const TicketMessage = require('../../models/TicketMessage');
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before;

    const query = { ticket: req.params.id }; // Admin sees internal notes
    if (before && /^[0-9a-fA-F]{24}$/.test(before)) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await TicketMessage.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('author', 'username email profilePicture')
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    res.json({
      messages: messages.reverse(),
      hasMore
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/admin/tickets/:id — full ticket (no embedded messages)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const cacheKey = `tickets:admin:detail:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const t = await Ticket.findById(String(req.params.id))
      .populate('user', 'username email')
      .populate('assignee', 'username email')
      .lean();
    if (!t) return res.status(404).json({ error: 'Not found' });

    t.messages = [];

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

    const t = await Ticket.findById(String(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });

    const isInternal = !!internal;
    const TicketMessage = require('../../models/TicketMessage');

    const savedMsg = await TicketMessage.create({
      ticket: t._id,
      author: adminId,
      authorRole: 'admin',
      body: body.trim(),
      internal: isInternal,
      createdAt: new Date()
    });

    t.updatedAt = new Date();
    if (!isInternal) {
      t.lastAdminReplyAt = new Date();
      // Auto-transition: open → pending when admin replies publicly
      if (t.status === 'open') t.status = 'pending';
      // pending stays pending, resolved/closed are not changed by a reply
    }
    await t.save();

    // Notify ticket owner on public reply (non-blocking)
    if (!isInternal) {
      try {
        const User = require('../../models/User');
        const owner = await User.findById(t.user).lean();
        if (owner && owner.email) {
          const { sendMailTemplate } = require('../../lib/mail');
          let frontendHost = process.env.FRONTEND_URL || '';
          if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;
          
          let statusBg = '#2b2512', statusColor = '#fde047', statusBorder = '#453413'; // default pending
          if (t.status === 'open') { statusBg = '#102a1d'; statusColor = '#86efac'; statusBorder = '#144026'; }
          else if (t.status === 'resolved') { statusBg = '#18253a'; statusColor = '#93c5fd'; statusBorder = '#1a396b'; }
          else if (t.status === 'closed') { statusBg = '#303030'; statusColor = '#AAAAAA'; statusBorder = '#404040'; }

          await sendMailTemplate({
            to: owner.email,
            templateKey: 'ticketReply',
            data: { 
              username: owner.username,
              title: t.title, 
              snippet: String(body).slice(0, 200),
              ticketId: String(t._id),
              category: String(t.category).charAt(0).toUpperCase() + String(t.category).slice(1),
              priority: String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1),
              status: String(t.status).charAt(0).toUpperCase() + String(t.status).slice(1),
              statusBg,
              statusColor,
              statusBorder,
              frontendUrl: frontendHost
            }
          });
        }
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    }

    // Invalidate caches
    await deleteCachePattern('tickets:admin:list:*');
    await deleteCachePattern(`tickets:mine:${t.user}:*`);
    await deleteCachePattern(`tickets:admin:detail:${req.params.id}`);

    await savedMsg.populate('author', 'username email profilePicture');

    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.ticket.reply', 'ticket', t._id.toString(), { isInternal, messagePreview: body.substring(0, 50) });

    res.json({ ok: true, message: savedMsg, status: t.status });
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
    const t = await Ticket.findById(String(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });

    const originalTicket = t.toObject();
    let changed = false;
    if (status !== undefined && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      if (t.status === 'closed' && status === 'resolved') {
        return res.status(400).json({ error: 'Cannot resolve a closed ticket. Please reopen it first.' });
      }
      
      if (t.status !== status && (status === 'resolved' || status === 'closed')) {
        try {
          const User = require('../../models/User');
          const owner = await User.findById(t.user).lean();
          if (owner && owner.email) {
            const { sendMailTemplate } = require('../../lib/mail');
            let frontendHost = process.env.FRONTEND_URL || '';
            if (frontendHost && !frontendHost.startsWith('http')) frontendHost = `https://${frontendHost}`;
            await sendMailTemplate({
              to: owner.email,
              templateKey: status === 'resolved' ? 'ticketResolved' : 'ticketClosed',
              data: {
                username: owner.username,
                title: t.title,
                ticketId: String(t._id),
                category: String(t.category).charAt(0).toUpperCase() + String(t.category).slice(1),
                priority: String(t.priority).charAt(0).toUpperCase() + String(t.priority).slice(1),
                frontendUrl: frontendHost
              }
            });
          }
        } catch {}
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

      const changes = {};
      if (status !== undefined && status !== originalTicket.status) changes.status = { old: originalTicket.status, new: status };
      if (priority !== undefined && priority !== originalTicket.priority) changes.priority = { old: originalTicket.priority, new: priority };
      if (assignee !== undefined) {
        const oldAssignee = originalTicket.assignee ? originalTicket.assignee.toString() : null;
        const newAssignee = assignee ? String(assignee) : null;
        if (oldAssignee !== newAssignee) changes.assignee = { old: oldAssignee, new: newAssignee };
      }
      if (Array.isArray(tags)) changes.tags = { old: originalTicket.tags || [], new: tags.slice(0, 20) };
      if (typeof deletedByUser === 'boolean' && deletedByUser !== originalTicket.deletedByUser) changes.deletedByUser = { old: originalTicket.deletedByUser, new: deletedByUser };

      const { writeAudit } = require('../../middleware/audit');
      await writeAudit(req, 'admin.ticket.update', 'ticket', t._id.toString(), { changes });
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
    const result = await Ticket.findByIdAndDelete(String(req.params.id));
    if (!result) return res.status(404).json({ error: 'Not found' });
    
    // Invalidate caches
    await deleteCachePattern('tickets:admin:list:*');
    if (result.user) await deleteCachePattern(`tickets:mine:${result.user}:*`);
    await deleteCachePattern(`tickets:admin:detail:${req.params.id}`);
    
    const { writeAudit } = require('../../middleware/audit');
    await writeAudit(req, 'admin.ticket.delete', 'ticket', result._id.toString(), { title: result.title });

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
