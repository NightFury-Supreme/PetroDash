const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const Server = require('../../models/Server');
const { deleteServer: deletePanelServer } = require('../../services/pterodactyl');

const router = express.Router();

// DELETE /api/servers/:id
router.delete('/', requireAuth, async (req, res) => {
  const server = await Server.findOne({ _id: req.params.id, owner: req.user.sub });
  if (!server) return res.status(404).json({ error: 'Server not found' });
  
  // Check if server is suspended
  if (server.status.toLowerCase() === 'suspended') {
    return res.status(403).json({ 
      error: 'Cannot delete suspended server', 
      details: 'Server is suspended. Contact staff for assistance.',
      serverId: server._id
    });
  }

  try {
    await deletePanelServer(server.panelServerId);
  } catch (e) {
    // If panel deletion fails for not found, proceed with local deletion
    const detail = e?.response?.data || e.message;
    const isNotFound = String(detail || '').toLowerCase().includes('not found');
    if (!isNotFound) return res.status(502).json({ error: 'Panel delete failed', details: detail });
  }

  await Server.deleteOne({ _id: server._id });
  const { writeAudit } = require('../../middleware/audit');
  writeAudit(req, 'server.delete', 'server', server._id.toString(), { panelServerId: server.panelServerId });
  return res.json({ ok: true });
});

module.exports = router;


