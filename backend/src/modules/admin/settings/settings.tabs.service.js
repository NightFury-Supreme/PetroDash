const general = require('./settings.general.service');
const integrations = require('./settings.integrations.service');

module.exports = {
  ...general,
  ...integrations,
};
