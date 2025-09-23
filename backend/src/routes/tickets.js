const express = require('express');
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Settings = require('../models/Settings');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Rate limiting handled globally in /api

// Create ticket
router.post('/', requireAuth, async(req, res) => {
  try {
    const userId =
      (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, message, category } = req.body || {};
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      return res.status(400).json({ error: 'Message must be at least 3 characters' });
    }
    // Resolve allowed categories from settings
    let allowedCategories = [
      'general',
      'billing',
      'technical',
      'abuse',
      'account',
      'server',
      'payment',
      'other'
    ];
    try {
      const s = await Settings.findOne({}).lean();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0) {
        allowedCategories = s.ticketCategories.map(c => String(c)).filter(Boolean);
      }
    } catch (_) {}

    // Auto priority based on active plans
    let effectivePriority = 'low';
    try {
      const activePlans = await mongoose
        .model('UserPlan')
        .find({ userId, status: 'active' })
        .limit(1)
        .lean();
      if (activePlans && activePlans.length > 0) effectivePriority = 'high';
    } catch (_) {}

    const selectedCategory =
      typeof category === 'string' ? category.trim().slice(0, 100) : 'general';
    const allowedLower = allowedCategories.map(c => String(c).toLowerCase());
    const idx = allowedLower.indexOf(String(selectedCategory).toLowerCase());
    const finalCategory = idx >= 0 ? allowedCategories[idx] : allowedCategories[0] || 'general';

    const ticket = await Ticket.create({
      user: new mongoose.Types.ObjectId(String(userId)),
      title: title.trim(),
      category: finalCategory,
      // Priority is enforced by server-side plan status: free => low, has plan => high
      priority: effectivePriority,
      messages: [{ author: userId, body: message.trim() }]
    });
    // Notify user of ticket creation (non-blocking)
    try {
      const User = require('../models/User');
      const u = await User.findById(userId).lean();
      if (u?.email) {
        const { sendMailTemplate } = require('../lib/mail');
        await sendMailTemplate({
          to: u.email,
          templateKey: 'ticketCreated',
          data: { title: title.trim() }
        });
      }
    } catch (_) {}
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// List my tickets
router.get('/mine', requireAuth, async(req, res) => {
  try {
    const userId =
      (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.query;
    const query = { user: userId, deletedByUser: { $ne: true } };
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      query.status = { $eq: status };
    }
    const tickets = await Ticket.find(query).sort({ updatedAt: -1 }).lean();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Public: list available categories (for UI selects)
router.get('/categories', requireAuth, async(req, res) => {
  try {
    let categories = [
      'general',
      'billing',
      'technical',
      'abuse',
      'account',
      'server',
      'payment',
      'other'
    ];
    try {
      const s = await Settings.findOne({}).lean();
      if (s && Array.isArray(s.ticketCategories) && s.ticketCategories.length > 0) {
        categories = s.ticketCategories.map(c => String(c)).filter(Boolean);
      }
    } catch (_) {}
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// Get ticket by id (owner or admin)
router.get('/:id', requireAuth, async(req, res) => {
  try {
    const userId =
      (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    const isAdmin = !!(req.user && (req.user.role === 'admin' || req.user.isAdmin));
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id)
      .populate('user', 'username email')
      .populate('messages.author', 'username email')
      .lean();
    if (!t) return res.status(404).json({ error: 'Not found' });
    // Only owner can access this public endpoint. Admins must use admin routes.
    if (String(t.user._id) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    // If soft-deleted by user, block access for user and block messaging
    if (t.deletedByUser) {
      if (!isAdmin) return res.status(403).json({ error: 'This ticket has been deleted' });
    }
    // Hide internal messages from non-admins
    if (!isAdmin && Array.isArray(t.messages)) {
      t.messages = t.messages.filter(m => !m.internal);
    }
    res.json(t);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Add message (owner or admin)
router.post('/:id/messages', requireAuth, async(req, res) => {
  try {
    const userId =
      (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    const isAdmin = !!(req.user && (req.user.role === 'admin' || req.user.isAdmin));
    const { body, internal } = req.body || {};
    if (!body || typeof body !== 'string' || body.trim().length < 1) {
      return res.status(400).json({ error: 'Message required' });
    }
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id).populate('messages.author', 'username email');
    if (!t) return res.status(404).json({ error: 'Not found' });
    // Only owner can post on this public endpoint
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (t.deletedByUser) return res.status(403).json({ error: 'Ticket is deleted' });
    t.messages.push({ author: userId, body: body.trim(), internal: !!(isAdmin && internal) });
    t.updatedAt = new Date();
    // If ticket was resolved/closed and user adds a message, reopen to pending
    if (!isAdmin && (t.status === 'resolved' || t.status === 'closed')) {
      t.status = 'pending';
    }
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Update status (admin)
router.patch('/:id', requireAdmin, async(req, res) => {
  try {
    const { status, assignee, priority, tags } = req.body || {};
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) t.status = status;
    if (priority && ['low', 'medium', 'high'].includes(priority)) t.priority = priority;
    if (assignee) t.assignee = new mongoose.Types.ObjectId(String(assignee));
    if (Array.isArray(tags)) t.tags = tags.slice(0, 20);
    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Admin list
router.get('/', requireAdmin, async(req, res) => {
  try {
    const { q, status, priority } = req.query;
    const query = {};
    if (status && ['open', 'pending', 'resolved', 'closed'].includes(status)) {
      query.status = { $eq: status };
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
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

// User: update own ticket status or soft delete
router.post('/:id/status', requireAuth, async(req, res) => {
  try {
    const userId =
      (req.user && (req.user.sub || req.user.userId || req.user._id || req.user.id)) || null;
    const { action } = req.body || {};
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }
    const t = await Ticket.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.user) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });
    if (action === 'close') t.status = 'closed';
    if (action === 'resolve') t.status = 'resolved';
    if (action === 'reopen') t.status = 'open';
    if (action === 'delete') t.deletedByUser = true;
    t.updatedAt = new Date();
    await t.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
