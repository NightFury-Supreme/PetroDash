const PendingUpdate = require('../../models/PendingUpdate');
const { updatePanelUser } = require('../../services/pterodactyl');

async function syncPanelUser(user) {
  if (!user.pterodactylUserId) return;
  const payload = {
    email: user.email,
    username: user.username,
    first_name: user.firstName,
    last_name: user.lastName,
  };
  try {
    await updatePanelUser(user.pterodactylUserId, payload);
  } catch (_syncErr) {
    await PendingUpdate.create({
      pterodactylUserId: user.pterodactylUserId,
      payload: JSON.stringify(payload),
    }).catch(() => {});
  }
}

module.exports = {
  syncPanelUser,
};
