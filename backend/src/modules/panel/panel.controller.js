const panelService = require('./panel.service');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');
const AppError = require('../../utils/AppError');

const isPterodactylUnreachable = (error) => {
  if (error?.isAxiosError) {
    if (!error.response) return true;
    if (error.response.status >= 500 && error.response.status < 600) return true;
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(error?.code)) return true;
  return false;
};

class PanelController {
  async getPanelInfo(req, res, next) {
    try {
      const userId = req.user?.publicId || req.user?.sub || req.user?.userId || req.user?.id;
      if (!userId) {
        return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      const result = await panelService.getPanelInfo(userId);
      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) return next(error);
      if (error.response?.status === 404) return next(AppError.notFound('Panel user not found', 'ERR_PANEL_USER_NOT_FOUND'));
      if (error.response?.status === 401) return next(AppError.internal('Panel authentication error', 'ERR_PANEL_CONFIG'));
      if (error.response?.status === 403) return next(AppError.forbidden('Panel access denied', 'ERR_PANEL_ACCESS_DENIED'));
      if (error.response?.status === 429) return next(AppError.tooManyRequests('Panel rate limited', 'ERR_RATE_LIMIT'));
      if (isPterodactylUnreachable(error)) {
        return next(AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNAVAILABLE'));
      }
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    const userId = req.user?.sub || req.user?.publicId;
    if (!userId) {
      return next(AppError.unauthorized('Authentication required', 'ERR_UNAUTHORIZED'));
    }

    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      const newPassword = await panelService.resetPassword(userId);

      await logUserActivity(req, 'panel.password.reset', { sessionId: req.user?.sessionId });
      await writeAudit(req, 'panel.password.reset', 'panel', userId, { message: 'User requested panel password reset' });

      return res.json({ password: newPassword, ok: true, code: 'PASSWORD_RESET_SUCCESS' });
    } catch (error) {
      await writeAudit(req, 'panel.password.reset.failed', 'panel', userId, { error: error.message }).catch(() => {});
      if (error instanceof AppError) return next(error);
      if (error.response?.status === 404) return next(AppError.notFound('Panel user not found', 'ERR_PANEL_USER_NOT_FOUND'));
      if (error.response?.status === 401) return next(AppError.internal('Panel authentication error', 'ERR_PANEL_CONFIG'));
      if (error.response?.status === 403) return next(AppError.forbidden('Panel access denied', 'ERR_PANEL_ACCESS_DENIED'));
      if (error.response?.status === 422) return next(AppError.badRequest('Invalid password format', 'ERR_PANEL_INVALID_PASSWORD'));
      if (error.response?.status === 429) return next(AppError.tooManyRequests('Panel rate limited', 'ERR_RATE_LIMIT'));
      if (isPterodactylUnreachable(error)) {
        return next(AppError.serviceUnavailable('Pterodactyl panel is currently unreachable', 'ERR_PANEL_UNAVAILABLE'));
      }
      next(error);
    }
  }
}

module.exports = new PanelController();
