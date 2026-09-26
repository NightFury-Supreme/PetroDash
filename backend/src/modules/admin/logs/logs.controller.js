/**
 * Admin Logs Controller
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

const { getLogs } = require('./logs.service');
const { logsQuerySchema } = require('./logs.schema');
const AppError = require('../../../utils/AppError');

async function getLogsHandler(req, res, next) {
  try {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest('Invalid query parameters', 'ERR_LOGS_QUERY_INVALID', parsed.error.flatten());
    }

    const data = await getLogs(parsed.data);
    return res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = { getLogsHandler };
