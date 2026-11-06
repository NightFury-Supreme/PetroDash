const listService = require('./servers.admin.list.service');
const mutationService = require('./servers.admin.mutation.service');
const suspensionService = require('./servers.admin.suspension.service');

module.exports = {
  listServers: listService.listServers,
  listQueuedServers: listService.listQueuedServers,
  getServerDetails: listService.getServerDetails,
  clearQueue: mutationService.clearQueue,
  updateServer: mutationService.updateServer,
  deleteServer: mutationService.deleteServer,
  suspendServer: suspensionService.suspendServer,
  unsuspendServer: suspensionService.unsuspendServer,
};
