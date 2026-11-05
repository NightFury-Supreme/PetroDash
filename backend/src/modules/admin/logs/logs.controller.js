const { getLogs } = require('./logs.service');
const { logsQuerySchema } = require('./logs.schema');
const AppError = require('../../../utils/AppError');

async function getLogsHandler(req, res, next) {
  try {
    const parsed = logsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw AppError.badRequest(
        'ERR_LOGS_QUERY_INVALID',
        'ERR_LOGS_QUERY_INVALID',
        parsed.error.flatten()
      );
    }

    const data = await getLogs(parsed.data);
    return res.json(data);
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : AppError.internal('ERR_FAILED_TO_LOAD_LOGS', 'ERR_FAILED_TO_LOAD_LOGS')
    );
  }
}

module.exports = { getLogsHandler };

