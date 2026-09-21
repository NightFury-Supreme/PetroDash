const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const serversAdminController = require('../../modules/admin/servers/servers.admin.controller');

const router = express.Router();

router.get('/', requireAdmin, serversAdminController.listServers);
router.get('/queue', requireAdmin, serversAdminController.listQueuedServers);
router.delete('/queue/clear', requireAdmin, serversAdminController.clearQueue);
router.get('/:id', requireAdmin, serversAdminController.getServerDetails);
router.patch('/:id', requireAdmin, serversAdminController.updateServer);
router.delete('/:id', requireAdmin, serversAdminController.deleteServer);

module.exports = router;
