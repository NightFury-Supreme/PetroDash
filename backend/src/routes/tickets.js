const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Server = require('../models/Server');
const Payment = require('../models/Payment');
const { getSettings } = require('../lib/settings');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { getCache, setCache, deleteCachePattern } = require('../lib/redis');
const { logUserActivity } = require('../middleware/userActivity');
const router = express.Router();

function extractUserId(req) {
  return (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
}

// POST /api/tickets — create a new ticket
router.post('/', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, message, category, priority } = req.body || {};
    if (!title || typeof title !== 'string' || title.trim().length < 3)
      return res.status(400).json({ error: 'Title must be at least 3 characters' });
    if (!message || typeof message !== 'string' || message.trim().length < 3)
      return res.status(400).json({ error: 'Message must be at least 3 characters' });
    if (message.trim().length > 5000)
      return res.status(400).json({ error: 'Message cannot exceed 5000 characters' });

    // Spam prevention: Limit active tickets per user
    const activeTicketsCount = await Ticket.countDocuments({
      user: userId,
      status: { $in: ['open', 'pending'] },
      deletedByUser: { $ne: true }
    });

    if (activeTicketsCount >= 3) {
      return res.status(429).json({ error: 'You have reached the maximum limit of active tickets. Please wait for existing tickets to be resolved.' });
    }

    let allowedCategories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
    try {
      const s = await getSettings();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0)
        allowedCategories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

    let effectivePriority = 'low';
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      effectivePriority = priority;
    } else {
      try {
        const activePlans = await mongoose.model('UserPlan').find({ userId, status: 'active' }).limit(1).lean();
        if (activePlans && activePlans.length > 0) effectivePriority = 'high';
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    }

    const selectedCategory = typeof category === 'string' ? category.trim().slice(0, 100) : 'general';
    const allowedLower = allowedCategories.map((c) => String(c).toLowerCase());
    const idx = allowedLower.indexOf(String(selectedCategory).toLowerCase());
    const finalCategory = idx >= 0 ? allowedCategories[idx] : (allowedCategories[0] || 'general');

    const now = new Date();
    const ticket = await Ticket.create({
      user: new mongoose.Types.ObjectId(String(userId)),
      title: title.trim(),
      category: finalCategory,
      priority: effectivePriority,
      lastUserActivityAt: now,
    });

    const TicketMessage = require('../models/TicketMessage');
    const { sanitizeTicketMentions } = require('../utils/ticketMentions');
    const sanitizedBody = await sanitizeTicketMentions(message.trim(), userId);
    
    await TicketMessage.create({
      ticket: ticket._id,
      author: userId,
      authorRole: 'user',
      body: sanitizedBody,
      createdAt: now
    });

    try {
      const User = require('../models/User');
      const u = await User.findById(userId).lean();
      if (u && u.email) {
        const { sendMailTemplate } = require('../lib/mail');
        let frontendHost = process.env.FRONTEND_URL || '';
        if (frontendHost && !frontendHost.startsWith('http')) {
          frontendHost = `https://${frontendHost}`;
        }
        await sendMailTemplate({ 
          to: u.email, 
          templateKey: 'ticketCreated', 
          data: { 
            username: u.username,
            title: title.trim(),
            ticketId: String(ticket._id),
            category: String(finalCategory).charAt(0).toUpperCase() + String(finalCategory).slice(1),
            priority: String(effectivePriority).charAt(0).toUpperCase() + String(effectivePriority).slice(1),
            frontendUrl: frontendHost
          } 
        });
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

    // Invalidate user's ticket cache
    await deleteCachePattern(`tickets:mine:${userId}:*`);

    const { writeAudit } = require('../middleware/audit');
    const createdPayload = { created: { subject: ticket.subject, category: ticket.category, priority: ticket.priority } };
    
    await logUserActivity(req, 'ticket.create', { ticketId: ticket._id, ...createdPayload });
    await writeAudit(req, 'ticket.create', 'ticket', ticket._id.toString(), createdPayload);
    res.status(201).json(ticket);
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets/mine — list current user's tickets (no messages in list)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.query;
    
    const cacheKey = `tickets:mine:${userId}:${status || 'all'}`;
    const cachedTickets = await getCache(cacheKey);
    if (cachedTickets) {
      return res.json(cachedTickets);
    }

    const query = { user: userId, deletedByUser: { $ne: true } };
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status))
      query.status = { $eq: status };
    const tickets = await Ticket.find(query).select('-messages').sort({ updatedAt: -1 }).lean();
    
    await setCache(cacheKey, tickets, 30); // Cache for 30 seconds
    
    res.json(tickets);
   
  } catch {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/categories — available categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    let categories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
    try {
      const s = await getSettings();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0)
        categories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}
    res.json({ categories });
   
  } catch {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/tickets/:id/messages — paginated messages
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const t = await Ticket.findById(String(req.params.id)).select('user deletedByUser').lean();
    if (!t || String(t.user) !== String(userId) || t.deletedByUser) 
      return res.status(403).json({ error: 'Forbidden' });

    const TicketMessage = require('../models/TicketMessage');
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // cursor

    const query = { ticket: req.params.id, internal: false };
    if (before && /^[0-9a-fA-F]{24}$/.test(before)) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await TicketMessage.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('author', 'username email profilePicture')
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop(); // remove the extra one

    res.json({
      messages: messages.reverse(), // Send in chronological order
      hasMore
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/tickets/:id — get ticket detail (owner only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const cacheKey = `tickets:detail:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      if (String(cached.user._id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
      return res.json(cached);
    }

    const t = await Ticket.findById(String(req.params.id))
      .populate('user', 'username email')
      .lean();
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user._id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (t.deletedByUser) return res.status(403).json({ error: 'This ticket has been deleted' });
    
    // Fallback empty array since frontend expects it
    t.messages = [];
    await setCache(cacheKey, t, 30);
    res.json(t);
   
  } catch {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// GET /api/tickets/mentions/search — get servers and invoices for autocomplete (new tickets)
router.get('/mentions/search', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    const cacheKey = `mentions:search:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    let uid;
    try { uid = new (require('mongoose').Types.ObjectId)(String(userId)); } catch { uid = userId; }

    const [servers, payments] = await Promise.all([
      Server.find({ owner: uid }).select('_id name identifier').limit(5).lean(),
      Payment.find({ userId: uid, status: 'COMPLETED' }).select('_id amount createdAt').sort({ createdAt: -1 }).limit(5).lean()
    ]);
    const result = { servers, payments };
    setCache(cacheKey, result, 60).catch(() => {});
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// GET /api/tickets/:id/mentions — get servers and invoices for autocomplete (existing tickets)
router.get('/:id/mentions', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    const ticketId = String(req.params.id);
    const cacheKey = `mentions:ticket:${ticketId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const t = await Ticket.findById(ticketId).select('user').lean();
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let uid;
    try { uid = new (require('mongoose').Types.ObjectId)(String(t.user)); } catch { uid = t.user; }

    const [servers, payments] = await Promise.all([
      Server.find({ owner: uid }).select('_id name identifier').limit(5).lean(),
      Payment.find({ userId: uid, status: 'COMPLETED' }).select('_id amount createdAt').sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const result = { servers, payments };
    setCache(cacheKey, result, 60).catch(() => {});
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch mentions' });
  }
});

// POST /api/tickets/:id/messages — user sends a reply
router.post('/:id/messages', requireAuth, createRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { body } = req.body || {};
    if (!body || typeof body !== 'string' || body.trim().length < 1)
      return res.status(400).json({ error: 'Message required' });
    if (body.trim().length > 5000)
      return res.status(400).json({ error: 'Message cannot exceed 5000 characters' });
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const t = await Ticket.findById(String(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });
    if (t.status === 'closed') return res.status(400).json({ error: 'Ticket is closed. Please reopen it first.' });

    const TicketMessage = require('../models/TicketMessage');
    const { sanitizeTicketMentions } = require('../utils/ticketMentions');
    let sanitizedBody = await sanitizeTicketMentions(body.trim(), userId);

    // Spam prevention
    const lastUserMessage = await TicketMessage.findOne({ ticket: t._id, author: userId }).sort({ _id: -1 }).lean();
    if (lastUserMessage) {
      const timeSinceLastMessage = Date.now() - new Date(lastUserMessage.createdAt).getTime();
      if (timeSinceLastMessage < 10000) {
        return res.status(429).json({ error: 'Please wait a few seconds before sending another message.' });
      }
    }

    const savedMsg = await TicketMessage.create({
      ticket: t._id,
      author: userId,
      authorRole: 'user',
      body: sanitizedBody,
      createdAt: new Date()
    });

    t.updatedAt = new Date();
    t.lastUserActivityAt = new Date();
    // Reopen if resolved/pending when user replies
    if (t.status === 'resolved' || t.status === 'pending') t.status = 'open';
    await t.save();

    // Populate for response
    await savedMsg.populate('author', 'username email profilePicture');
    
    // Invalidate cache
    await deleteCachePattern(`tickets:mine:${userId}:*`);
    await deleteCachePattern(`tickets:detail:${req.params.id}`);
    
    const { writeAudit } = require('../middleware/audit');
    await logUserActivity(req, 'ticket.reply', { ticketId: t._id });
    await writeAudit(req, 'ticket.reply', 'ticket', t._id.toString(), { messagePreview: message.substring(0, 50) });
    res.json({ ok: true, message: savedMsg, status: t.status });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// POST /api/tickets/:id/status - user resolves / reopens their ticket
router.post('/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { action } = req.body || {};
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const t = await Ticket.findById(String(req.params.id));
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });

    const oldStatus = t.status;

    if (action === 'resolved') {
      if (t.status === 'closed') {
        return res.status(400).json({ error: 'Cannot modify a closed ticket.' });
      }
      t.status = 'resolved';
    } else if (action === 'reopen') {
      const activeTicketsCount = await Ticket.countDocuments({
        user: userId,
        status: { $in: ['open', 'pending'] },
        deletedByUser: { $ne: true }
      });
      
      if (activeTicketsCount >= 3) {
        return res.status(429).json({ error: 'You have reached the maximum limit of 3 active tickets. Cannot reopen.' });
      }
      t.status = 'open';
      t.closedAt = null;
    } else {
      return res.status(400).json({ error: 'Invalid action. Allowed: resolved, reopen' });
    }

    t.updatedAt = new Date();
    await t.save();
    
    // Invalidate cache
    await deleteCachePattern(`tickets:mine:${userId}:*`);
    await deleteCachePattern(`tickets:detail:${req.params.id}`);
    
    const changes = { status: { old: oldStatus, new: t.status } };

    const { writeAudit } = require('../middleware/audit');
    await logUserActivity(req, 'ticket.status_change', { ticketId: t._id, changes });
    await writeAudit(req, 'ticket.status_change', 'ticket', t._id.toString(), { changes });
    res.json({ ok: true, status: t.status });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
