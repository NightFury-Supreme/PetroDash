const Server = require('../models/Server');
const User = require('../models/User');
const Egg = require('../models/Egg');
const Location = require('../models/Location');
const axios = require('axios');
const { getEggDetails } = require('../services/pterodactyl');
const { deleteCachePattern, deleteCache } = require('../lib/redis');
const { sendMailTemplate } = require('../lib/mail');

async function syncQueuedServers() {
  try {
    const queuedServers = await Server.find({ status: 'queued' }).sort({ priority: -1, createdAt: 1 });
    if (queuedServers.length === 0) return;

    let successCount = 0;
    
    // Process servers sequentially to avoid spamming the panel API
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
        let pteroVariables = {};
        try {
          const ed = await getEggDetails(egg.pterodactylNestId, egg.pterodactylEggId);
          startup = ed?.startup || '';
          dockerImage = ed?.docker_image || ed?.dockerImage || '';
          if (ed?.relationships?.variables?.data) {
            for (const v of ed.relationships.variables.data) {
              pteroVariables[v.attributes.env_variable] = String(v.attributes.default_value || '');
            }
          }
        } catch {}

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
            locations: [location.platform?.platformLocationId || location._id.toString()],
            dedicated_ip: false,
            port_range: [],
          },
          start_on_completion: true,
        };

        const base = (process.env.PTERO_BASE_URL || '').replace(/\/$/, '');
        const resp = await axios.post(`${base}/api/application/servers`, panelPayload, {
          headers: {
            Authorization: `Bearer ${process.env.PTERO_APP_API_KEY}`,
            Accept: 'Application/vnd.pterodactyl.v1+json',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });
        
        const panelServer = resp.data?.attributes;
        if (panelServer && panelServer.id) {
          // Sanity check: verify the user didn't delete the queued server while we were making the API call
          const stillExists = await Server.findById(server._id);
          if (!stillExists) {
            console.warn(`Server ${server._id} was deleted by user while provisioning on Pterodactyl. Cleaning up orphan panel server ${panelServer.id}.`);
            try {
              await axios.delete(`${base}/api/application/servers/${panelServer.id}`, {
                headers: {
                  Authorization: `Bearer ${process.env.PTERO_APP_API_KEY}`,
                  Accept: 'Application/vnd.pterodactyl.v1+json',
                }
              });
            } catch (delErr) {
              console.error(`Failed to cleanup orphan panel server ${panelServer.id}:`, delErr.message);
            }
            continue;
          }

          server.panelServerId = panelServer.id;
          server.status = 'active';
          await server.save();
          successCount++;

          await deleteCachePattern(`api:servers:${user._id}:*`);
          await deleteCachePattern(`server:usage:${user._id}`);
          await deleteCachePattern('api:admin:servers:*');
          await deleteCache('eggs:counts');

          try {
            const backendUrl = (process.env.API_URL || process.env.BACKEND_URL) 
              ? (process.env.API_URL || process.env.BACKEND_URL).replace(/\/$/, '')
              : `http://localhost`;
            const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : backendUrl;
            
            let locationHtml = location.name;
            let eggHtml = egg.name;
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
                dashboardUrl: frontendUrl + '/dashboard'
              },
            });
          } catch {}
        }
      } catch (e) {
        const errorStr = JSON.stringify(e?.response?.data || {}).toLowerCase();
        const isNodeIssue = errorStr.includes('not enough space') || 
                            errorStr.includes('no nodes satisfying') ||
                            errorStr.includes('offline') ||
                            errorStr.includes('allocations') ||
                            e.code === 'ECONNREFUSED' || 
                            e.code === 'ETIMEDOUT';
        
        if (!isNodeIssue) {
          console.error(`Fatal error creating queued server ${server._id}:`, e?.response?.data || e.message);
          await server.deleteOne();
        }
      }
    }
    
    if (successCount > 0) {
      console.log(`[Job] Successfully created ${successCount} queued servers`);
    }

  } catch (err) {
    console.error('[Job] Error running syncQueuedServers job:', err.message);
  }
}

let syncInterval = null;

function startQueuedServersJob() {
  if (syncInterval) return;
  setTimeout(syncQueuedServers, 15000);
  syncInterval = setInterval(syncQueuedServers, 2 * 60 * 1000);
  console.log('[Job] Started queued servers job (runs every 2 minutes)');
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
