const Server = require('../models/Server');
const User = require('../models/User');
const Egg = require('../models/Egg');
const Location = require('../models/Location');
const { getEggDetails, createPanelServer, deleteServer } = require('../services/pterodactyl');
const { publishEvent } = require('../lib/redis');
const { invalidateServerCaches } = require('../utils/serverCacheInvalidation');
const { sendMailTemplate } = require('../lib/mail');
const { writeAudit } = require('../middleware/audit');

async function syncQueuedServers() {
  try {
    const queuedServers = await Server.find({ status: 'queued' }).sort({ priority: -1, createdAt: 1 });
    if (queuedServers.length === 0) return;

    for (const server of queuedServers) {
      try {
        const user = await User.findById(server.owner);
        const egg = await Egg.findById(server.eggId);
        const location = await Location.findById(server.locationId);

        if (!user || !egg || !location) {
          await server.deleteOne();
          continue;
        }

        let startup = '';
        let dockerImage = '';
        const pteroVariables = {};
        try {
          const ed = await getEggDetails(egg.pterodactylNestId, egg.pterodactylEggId);
          startup = ed?.startup || '';
          dockerImage = ed?.docker_image || ed?.dockerImage || '';
          if (ed?.relationships?.variables?.data) {
            for (const v of ed.relationships.variables.data) {
              pteroVariables[v.attributes.env_variable] = String(v.attributes.default_value || '');
            }
          }
        } catch (_eggErr) { }

        const localEnv = Object.fromEntries((egg.env || []).map(v => [v.key, v.value]));
        const environment = { ...pteroVariables, ...localEnv };

        const panelPayload = {
          name: server.name,
          user: user.pterodactylUserId,
          egg: egg.pterodactylEggId,
          docker_image: dockerImage,
          startup,
          environment,
          limits: {
            memory: server.limits.memoryMb,
            swap: 0,
            disk: server.limits.diskMb,
            io: 500,
            cpu: server.limits.cpuPercent,
          },
          feature_limits: {
            databases: server.limits.databases,
            allocations: server.limits.allocations,
            backups: server.limits.backups,
          },
          allocation: { default: 0 },
          deploy: {
            locations: [
              !isNaN(Number(location.platform?.platformLocationId)) && Number(location.platform?.platformLocationId) > 0
                ? Number(location.platform.platformLocationId)
                : 1
            ],
            dedicated_ip: false,
            port_range: [],
          },
          start_on_completion: true,
        };

        const panelServer = await createPanelServer(panelPayload);
        if (panelServer && panelServer.id) {
          const stillExists = await Server.findById(server._id);
          if (!stillExists) {
            try {
              await deleteServer(panelServer.id);
            } catch (pteroDeleteErr) {
              process.stderr.write(`[Job] Failed to delete orphaned panel server ${panelServer.id}: ${pteroDeleteErr.message}\n`);
            }
            continue;
          }

          server.panelServerId = panelServer.id;
          server.identifier = panelServer.identifier || null;
          server.status = 'creating';
          await server.save();

          const publicServerId = server.publicId;
          const userPublicId = user.publicId;
          await invalidateServerCaches({
            userId: userPublicId,
            publicServerId,
            eggId: server.eggId ? String(server.eggId) : null,
            locationId: server.locationId ? String(server.locationId) : null,
          });
          await publishEvent(`user:${userPublicId}:servers`, { type: 'SERVER_UPDATED', serverId: publicServerId });

          try {
            await writeAudit(userPublicId, 'server.create', 'server', publicServerId, {
              serverName: server.name,
              serverId: publicServerId,
              panelServerId: panelServer.id,
              identifier: panelServer.identifier || null,
              egg: egg.name,
              location: location.name,
              actorRole: user.role || 'user',
              actorUsername: user.username,
              status: 'creating',
              created: {
                serverId: publicServerId,
                serverName: server.name,
                status: 'creating',
                ...(panelServer.identifier ? { identifier: panelServer.identifier } : {}),
                panelServerId: panelServer.id,
                egg: egg.name,
                location: location.name,
                memoryMb: Number(server.limits?.memoryMb || 0),
                diskMb: Number(server.limits?.diskMb || 0),
                cpuPercent: Number(server.limits?.cpuPercent || 0),
                backups: Number(server.limits?.backups || 0),
                databases: Number(server.limits?.databases || 0),
                allocations: Number(server.limits?.allocations || 0),
              }
            });
          } catch (auditErr) {
            process.stderr.write(`[Job] Failed to write server create audit log: ${auditErr.message}\n`);
          }

          try {
            const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
            const locationHtml = location.name;
            const eggHtml = egg.name;
            await sendMailTemplate({
              to: user.email,
              templateKey: 'serverCreated',
              data: {
                username: user.username,
                serverName: server.name,
                serverId: panelServer.identifier || panelServer.id,
                cpu: server.limits.cpuPercent,
                ram: server.limits.memoryMb,
                disk: server.limits.diskMb,
                ports: server.limits.allocations,
                databases: server.limits.databases,
                eggHtml,
                locationHtml,
                dashboardUrl: frontendUrl ? `${frontendUrl}/dashboard` : '/dashboard'
              },
            });
          } catch (mailErr) {
            process.stderr.write(`[Job] Failed to send queued server active email: ${mailErr.message}\n`);
          }
        }
      } catch (_syncErr) { }
    }
  } catch (jobErr) {
    process.stderr.write(`[Job] syncQueuedServers error: ${jobErr.message}\n`);
  }
}

let syncInterval = null;

function startQueuedServersJob() {
  if (syncInterval) return;
  setTimeout(syncQueuedServers, 15000);
  syncInterval = setInterval(syncQueuedServers, 2 * 60 * 1000);
}

function stopQueuedServersJob() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

module.exports = {
  syncQueuedServers,
  startQueuedServersJob,
  stopQueuedServersJob
};
