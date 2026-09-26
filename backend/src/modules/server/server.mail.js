const Egg = require('../../models/Egg');
const Location = require('../../models/Location');
const { sendMailTemplate } = require('../../lib/mail');

async function sendServerDeletedEmail(user, server, serverIdentifier, reqHost = '') {
  if (!user?.email) return;
  try {
    const egg = await Egg.findById(server.eggId);
    const location = await Location.findById(server.locationId);
    const backendUrl = (process.env.API_URL || process.env.BACKEND_URL) 
      ? (process.env.API_URL || process.env.BACKEND_URL).replace(/\/$/, '')
      : reqHost;

    let eggHtml = egg?.name || 'Unknown Egg';
    if (egg && egg.icon) {
      const iconUrl = egg.icon.startsWith('http') ? egg.icon : `${backendUrl}${egg.icon.startsWith('/') ? '' : '/'}${egg.icon}`;
      eggHtml = `<img src="${iconUrl}" alt="" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px; border-radius: 4px;"> ${egg.name}`;
    }

    let locationHtml = location?.name || location?.short || 'Unknown Location';
    if (location && location.flag) {
      const flagUrl = location.flag.startsWith('http') ? location.flag : `${backendUrl}${location.flag.startsWith('/') ? '' : '/'}${location.flag}`;
      locationHtml = `<img src="${flagUrl}" alt="" style="width: 20px; height: 15px; border-radius: 2px; vertical-align: middle; margin-right: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"> ${location.name || location.short}`;
    }

    await sendMailTemplate({
      to: user.email,
      templateKey: 'serverDeleted',
      data: { 
        username: user.username,
        serverName: server.name,
        serverId: serverIdentifier || server.panelServerId || server._id.toString().substring(0, 8),
        cpu: server.limits?.cpuPercent || 0,
        ram: server.limits?.memoryMb || 0,
        disk: server.limits?.diskMb || 0,
        databases: server.limits?.databases || 0,
        ports: server.limits?.allocations || 0,
        eggHtml,
        locationHtml,
      },
    });
  } catch (_) {
    // Non-blocking email alert failure ignored
  }
}

module.exports = {
  sendServerDeletedEmail,
};
