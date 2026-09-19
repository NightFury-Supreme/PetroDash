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
      if (error.message === 'NOT_FOUND') return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
      if (error.message === 'PROVISIONING_PENDING') return next(new AppError('Account Provisioning Pending', 503, 'ERR_PROVISIONING_PENDING', 'Your panel account is currently pending creation because the control panel is temporarily unavailable. We are automatically retrying in the background. Please check back in a few minutes.'));
      if (error.message === 'CONFIG_ERROR') return next(new AppError('Panel configuration error', 500, 'ERR_PANEL_CONFIG'));
      if (error.message === 'PANEL_USER_NOT_FOUND' || error.response?.status === 404) return next(new AppError('Panel user not found', 404, 'ERR_PANEL_USER_NOT_FOUND', 'Your panel account could not be located. Please contact support.'));
      if (error.response?.status === 403) return next(new AppError('Panel access denied', 403, 'ERR_PANEL_ACCESS_DENIED', 'You do not have permission to access the panel.'));

      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const newPassword = await panelService.resetPassword(userId);

      await logUserActivity(req, 'panel.password.reset', { sessionId: req.user?.sessionId });
      await writeAudit(req, 'panel.password.reset', 'panel', userId.toString(), { message: 'User requested panel password reset' });

      return res.json({ password: newPassword, message: 'Password reset successfully' });
    } catch (error) {
      if (error.message === 'NOT_FOUND') return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
      if (error.message === 'PROVISIONING_PENDING') return next(new AppError('Account Provisioning Pending', 503, 'ERR_PROVISIONING_PENDING', 'Your panel account is currently pending creation because the control panel is temporarily unavailable. We are automatically retrying in the background. Please check back in a few minutes.'));
      if (error.message === 'PANEL_USER_NOT_FOUND' || error.response?.status === 404) return next(new AppError('Panel user not found', 404, 'ERR_PANEL_USER_NOT_FOUND', 'Your panel account could not be located.'));
      if (error.response?.status === 403) return next(new AppError('Panel access denied', 403, 'ERR_PANEL_ACCESS_DENIED', 'You do not have permission to reset the panel password.'));
      if (error.response?.status === 422) return next(new AppError('Invalid password format', 422, 'ERR_PANEL_INVALID_PASSWORD', 'The generated password does not meet panel requirements.'));

      next(error);
    }
  }
}

module.exports = new PanelController();
