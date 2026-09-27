const panelService = require('./panel.service');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

class PanelController {
  async getPanelInfo(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const result = await panelService.getPanelInfo(userId);
      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) return next(error);
      if (error.response?.status === 404) return next(AppError.notFound('Panel user not found', 'ERR_PANEL_USER_NOT_FOUND'));
      if (error.response?.status === 403) return next(AppError.forbidden('Panel access denied', 'ERR_PANEL_ACCESS_DENIED'));
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const newPassword = await panelService.resetPassword(userId);

      await logUserActivity(req, 'panel.password.reset', { sessionId: req.user?.sessionId });
      await writeAudit(req, 'panel.password.reset', 'panel', userId.toString(), { message: 'User requested panel password reset' });

      return res.json({ password: newPassword, ok: true, code: 'PASSWORD_RESET_SUCCESS' });
    } catch (error) {
      if (error instanceof AppError) return next(error);
      if (error.response?.status === 404) return next(AppError.notFound('Panel user not found', 'ERR_PANEL_USER_NOT_FOUND'));
      if (error.response?.status === 403) return next(AppError.forbidden('Panel access denied', 'ERR_PANEL_ACCESS_DENIED'));
      if (error.response?.status === 422) return next(AppError.badRequest('Invalid password format', 'ERR_PANEL_INVALID_PASSWORD'));
      next(error);
    }
  }
}

module.exports = new PanelController();
