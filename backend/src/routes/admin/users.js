const express = require('express');
const { requireAdmin } = require('../../middleware/auth');
const { handleAvatarUpload } = require('../../middleware/avatarUpload');
const { usersAdminController: controller } = require('../../modules/admin/users');

const router = express.Router();

router.get('/', requireAdmin, controller.listUsers);
router.get('/:id', requireAdmin, controller.getUser);
router.get('/:id/activity', requireAdmin, controller.getUserActivity);
router.patch('/:id', requireAdmin, controller.updateUser);
router.post('/:id/picture/upload', requireAdmin, handleAvatarUpload('avatar'), controller.uploadUserAvatar);
router.delete('/:id/picture', requireAdmin, controller.resetUserAvatar);
router.post('/:id/ban', requireAdmin, controller.banUser);
router.delete('/:id', requireAdmin, controller.deleteUser);
router.delete('/:id/servers/:serverId', requireAdmin, controller.deleteServer);
router.get('/:id/servers/:serverId', requireAdmin, controller.getServer);
router.patch('/:id/servers/:serverId', requireAdmin, controller.updateServer);
router.post('/:id/plans', requireAdmin, controller.addPlan);
router.delete('/:id/plans/:planId', requireAdmin, controller.cancelPlans);
router.delete('/:id/plans/instance/:instanceId', requireAdmin, controller.cancelPlanInstance);
router.get('/:id/sessions', requireAdmin, controller.getUserSessions);
router.delete('/:id/sessions/:sessionId', requireAdmin, controller.revokeUserSession);
router.delete('/:id/sessions', requireAdmin, controller.revokeAllUserSessions);
router.post('/:id/2fa/reset', requireAdmin, controller.resetUser2FA);
router.post('/:id/email/verify', requireAdmin, controller.verifyUserEmail);

module.exports = router;
