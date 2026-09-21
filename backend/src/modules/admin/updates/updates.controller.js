const updatesService = require('./updates.service');
const AppError = require('../../../utils/AppError');

exports.checkUpdates = async (req, res, next) => {
    try {
        const result = await updatesService.checkUpdates();
        res.json(result);
    } catch (error) {
        console.error('Error checking for updates:', error);
        next(new AppError(
            'Failed to check for updates',
            500,
            'ERR_INTERNAL',
            { message: error.response?.data?.message || error.message || 'Unknown error occurred' }
        ));
    }
};
