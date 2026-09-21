const statsService = require('./stats.service');
const { statsQuerySchema } = require('./stats.schema');
const AppError = require('../../../utils/AppError');

exports.getStats = async (req, res, next) => {
    try {
        const parsed = statsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            throw new AppError('Invalid query parameters', 400, 'ERR_INVALID_QUERY_PARAMS', parsed.error.flatten());
        }
        const { range, refresh } = parsed.data;
        const result = await statsService.getStats(range, refresh === 'true');
        res.json(result);
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }
        console.error('Stats error:', error);
        next(new AppError('Failed to fetch dashboard stats', 500, 'ERR_STATS_FETCH_FAILED'));
    }
};
