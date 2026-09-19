const panelService = require('./panel.service');
const { logUserActivity } = require('../../middleware/userActivity');
const { writeAudit } = require('../../middleware/audit');

class PanelController {
  async getPanelInfo(req, res, next) {
    try {
      const userId = req.user.sub || req.user.userId || req.user._id || req.user.id;
      const result = await panelService.getPanelInfo(userId);
      return res.json(result);
    } catch (error) {
      if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
      if (error.message === 'PROVISIONING_PENDING') return res.status(503).json({ error: 'Account Provisioning Pending', details: 'Your panel account is currently pending creation because the control panel is temporarily unavailable. We are automatically retrying in the background. Please check back in a few minutes.' });
      if (error.message === 'CONFIG_ERROR') return res.status(500).json({ error: 'Panel configuration error', details: 'Panel URL is not configured properly.' });
      if (error.message === 'PANEL_USER_NOT_FOUND') return res.status(404).json({ error: 'Panel user not found', details: 'Your panel account could not be located. Please contact support.' });
      
      if (error.response?.status === 404) return res.status(404).json({ error: 'Panel user not found', details: 'Your panel account could not be located. Please contact support.' });
      if (error.response?.status === 403) return res.status(403).json({ error: 'Panel access denied', details: 'You do not have permission to access the panel.' });

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
      if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'User not found' });
      if (error.message === 'PROVISIONING_PENDING') return res.status(503).json({ error: 'Account Provisioning Pending', details: 'Your panel account is currently pending creation because the control panel is temporarily unavailable. We are automatically retrying in the background. Please check back in a few minutes.' });
      if (error.message === 'PANEL_USER_NOT_FOUND') return res.status(404).json({ error: 'Panel user not found', details: 'Your panel account could not be located.' });

      if (error.response?.status === 404) return res.status(404).json({ error: 'Panel user not found', details: 'Your panel account could not be located.' });
      if (error.response?.status === 403) return res.status(403).json({ error: 'Panel access denied', details: 'You do not have permission to reset the panel password.' });
      if (error.response?.status === 422) return res.status(422).json({ error: 'Invalid password format', details: 'The generated password does not meet panel requirements.' });

      next(error);
    }
  }
}

module.exports = new PanelController();
