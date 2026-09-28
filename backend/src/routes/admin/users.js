const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { usersAdminController: controller } = require('../../modules/admin/users');

const router = express.Router();

router.get('/', requireAdmin, controller.listUsers);
router.get('/:id', requireAdmin, controller.getUser);
router.patch('/:id', requireAdmin, controller.updateUser);
router.post('/:id/ban', requireAdmin, controller.banUser);
router.delete('/:id', requireAdmin, controller.deleteUser);
router.delete('/:id/servers/:serverId', requireAdmin, controller.deleteServer);
router.get('/:id/servers/:serverId', requireAdmin, controller.getServer);
router.patch('/:id/servers/:serverId', requireAdmin, controller.updateServer);
router.post('/:id/plans', requireAdmin, controller.addPlan);
router.delete('/:id/plans/:planId', requireAdmin, controller.cancelPlans);
router.delete('/:id/plans/instance/:instanceId', requireAdmin, controller.cancelPlanInstance);

module.exports = router;
