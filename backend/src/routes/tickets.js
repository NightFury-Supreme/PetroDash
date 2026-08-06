const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Settings = require('../models/Settings');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const router = express.Router();

function extractUserId(req) {
  return (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
}

// POST /api/tickets — create a new ticket
router.post('/', requireAuth, createRateLimiter(5, 60 * 1000), async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, message, category } = req.body || {};
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
      const s = await Settings.findOne({}).lean();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0)
        allowedCategories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

    let effectivePriority = 'low';
    try {
      const activePlans = await mongoose.model('UserPlan').find({ userId, status: 'active' }).limit(1).lean();
      if (activePlans && activePlans.length > 0) effectivePriority = 'high';
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

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
      messages: [{ author: userId, authorRole: 'user', body: message.trim() }],
    });

    try {
      const User = require('../models/User');
      const u = await User.findById(userId).lean();
      if (u && u.email) {
        const { sendMailTemplate } = require('../lib/mail');
        await sendMailTemplate({ to: u.email, templateKey: 'ticketCreated', data: { title: title.trim() } });
      }
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}

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
    const query = { user: userId, deletedByUser: { $ne: true } };
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status))
      query.status = { $eq: status };
    const tickets = await Ticket.find(query).select('-messages').sort({ updatedAt: -1 }).lean();
    res.json(tickets);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/categories — available categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    let categories = ['general', 'billing', 'technical', 'abuse', 'account', 'server', 'payment', 'other'];
    try {
      const s = await Settings.findOne({}).lean();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0)
        categories = s.ticketCategories.map((c) => String(c)).filter(Boolean);
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (_) {}
    res.json({ categories });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/tickets/:id — get ticket detail (owner only)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    const t = await Ticket.findById(req.params.id)
      .populate('user', 'username email')
      .populate('messages.author', 'username email')
      .lean();
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user._id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (t.deletedByUser) return res.status(403).json({ error: 'This ticket has been deleted' });
    // Filter out internal admin notes from user view
    t.messages = (t.messages || []).filter((m) => !m.internal);
    res.json(t);
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
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

    const t = await Ticket.findById(req.params.id).populate('messages.author', 'username email');
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });
    if (t.status === 'closed') return res.status(400).json({ error: 'Ticket is closed. Please reopen it first.' });

    // Spam prevention: Check if user sent a message in the last 10 seconds
    const lastUserMessage = t.messages.slice().reverse().find(m => String(m.author._id || m.author) === String(userId));
    if (lastUserMessage) {
      const timeSinceLastMessage = Date.now() - new Date(lastUserMessage.createdAt).getTime();
      if (timeSinceLastMessage < 10000) {
        return res.status(429).json({ error: 'Please wait a few seconds before sending another message.' });
      }
    }

    t.messages.push({ author: userId, authorRole: 'user', body: body.trim() });
    t.updatedAt = new Date();
    t.lastUserActivityAt = new Date();
    // Reopen if resolved/pending when user replies
    if (t.status === 'resolved' || t.status === 'pending') t.status = 'open';
    await t.save();

    const savedMsg = t.messages[t.messages.length - 1];
    res.json({ ok: true, message: savedMsg, status: t.status });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// POST /api/tickets/:id/status — user closes / reopens / deletes their ticket
router.post('/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = extractUserId(req);
    const { action } = req.body || {};
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id))
      return res.status(400).json({ error: 'Invalid ticket ID format' });

    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });

    if (action === 'close') {
      t.status = 'closed';
      t.closedAt = new Date();
    } else if (action === 'reopen') {
      t.status = 'open';
      t.closedAt = null;
    } else if (action === 'delete') {
      t.deletedByUser = true;
    } else {
      return res.status(400).json({ error: 'Invalid action. Allowed: close, reopen, delete' });
    }

    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true, status: t.status });
  // eslint-disable-next-line unused-imports/no-unused-vars
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
