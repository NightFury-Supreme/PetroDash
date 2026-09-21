const statsService = require('./stats.service');
const AppError = require('../../../utils/AppError');

exports.getStats = async (req, res, next) => {
    try {
        const rangeParam = req.query.range || '7D';
        const result = await statsService.getStats(rangeParam);
        res.json(result);
    } catch (error) {
        console.error('Stats error:', error);
        next(new AppError('Internal server error', 500, 'ERR_INTERNAL'));
    }
};
