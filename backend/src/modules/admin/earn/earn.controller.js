const { z } = require('zod');
const earnService = require('./earn.service');
const { writeAudit } = require('../../../middleware/audit');
const AppError = require('../../../utils/AppError');

const earnPatchSchema = z.object({
  linkvertise: z.object({
    enabled: z.coerce.boolean().optional(),
    coins: z.coerce.number().int().min(0).max(1000000).optional(),
    cooldownSeconds: z.coerce.number().int().min(0).max(86400).optional(),
    waitSeconds: z.coerce.number().int().min(0).max(3600).optional(),
    maxClaimsPerDay: z.coerce.number().int().min(0).max(1000).optional(),
    url: z.string().max(2048).optional().or(z.literal('')),
    antiBypassToken: z.string().max(2048).optional().or(z.literal('')),
  }).optional(),
});

class EarnController {
  async getSettings(req, res, next) {
    try {
      const out = await earnService.getSettings();
      res.json(out);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const parsed = earnPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      }

      const { updatedEarn, changes } = await earnService.updateSettings(parsed.data);

      await writeAudit(req, 'admin.earn.update', 'earn_settings', null, { changes: Object.keys(changes).length > 0 ? changes : undefined });

      res.json(updatedEarn);
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req, res, next) {
    try {
      const { userId, method, status } = req.query;
      const list = await earnService.getSessions({ userId, method, status });
      res.json(list);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EarnController();
