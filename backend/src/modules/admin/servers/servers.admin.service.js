/* ==========================================================================
   Admin Servers Service Facade
   Compliance: ISO/IEC 25010, Barrel/Facade Pattern
========================================================================== */

const listService = require('./servers.admin.list.service');
const mutationService = require('./servers.admin.mutation.service');

module.exports = {
  listServers: listService.listServers,
  listQueuedServers: listService.listQueuedServers,
  getServerDetails: listService.getServerDetails,
  clearQueue: mutationService.clearQueue,
  updateServer: mutationService.updateServer,
  deleteServer: mutationService.deleteServer,
};
