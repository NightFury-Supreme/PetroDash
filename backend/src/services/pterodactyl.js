const axios = require('axios');

const PANEL_BASE = process.env.PTERO_BASE_URL;
const APP_KEY = process.env.PTERO_APP_API_KEY;

if (!PANEL_BASE) {
  // Do not throw during module load to allow env tooling to run health route
  console.warn('PTERO_BASE_URL is not set');
}
if (!APP_KEY) {
  console.warn('PTERO_APP_API_KEY is not set');
}

const api = axios.create({
  baseURL: PANEL_BASE ? `${PANEL_BASE.replace(/\/$/, '')}/api/application` : undefined,
  headers: {
    Authorization: `Bearer ${APP_KEY || ''}`,
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

async function withRetry(fn, { retries = 2, delayMs = 500 } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.response?.status;
      const isNetwork = !status;
      const retryable = isNetwork || (status >= 500 && status < 600);
      if (!retryable || attempt === retries) {
        throw e;
      }
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
      attempt += 1;
      lastErr = e;
    }
  }
  throw lastErr;
}

async function createPanelUser({ email, username, firstName, lastName, password }) {
  const payload = {
    email,
    username,
    first_name: firstName,
    last_name: lastName,
    password
  };
  const { data } = await withRetry(() => api.post('/users', payload));
  return data?.attributes;
}

async function getUserByExternalId(externalId) {
  const { data } = await withRetry(() =>
    api.get(`/users/external/${encodeURIComponent(externalId)}`)
  );
  return data?.attributes;
}

async function getUserWithServers(userId) {
  const { data } = await withRetry(() => api.get(`/users/${userId}?include=servers`));
  return data;
}

async function getEggDetails(nestId, eggId) {
  const { data } = await withRetry(() => api.get(`/nests/${nestId}/eggs/${eggId}`));
  return data?.attributes;
}

async function getServer(serverId) {
  const { data } = await withRetry(() => api.get(`/servers/${serverId}?include=allocations`));
  return data;
}

async function updateServerDetails(serverId, { name, user, external_id }) {
  const payload = { name, user, external_id };
  const { data } = await withRetry(() => api.patch(`/servers/${serverId}/details`, payload));
  return data?.attributes;
}

async function updateServerBuild(
  serverId,
  { allocation, memory, swap = 0, disk, io = 500, cpu, databases, allocations, backups }
) {
  const payload = {
    allocation,
    memory,
    swap,
    disk,
    io,
    cpu,
    feature_limits: { databases, allocations, backups }
  };
  const { data } = await withRetry(() => api.patch(`/servers/${serverId}/build`, payload));
  return data?.attributes;
}

async function deleteServer(serverId) {
  await withRetry(() => api.delete(`/servers/${serverId}`));
  return true;
}

async function suspendServer(serverId) {
  await withRetry(() => api.post(`/servers/${serverId}/suspend`));
  return true;
}

async function unsuspendServer(serverId) {
  await withRetry(() => api.post(`/servers/${serverId}/unsuspend`));
  return true;
}

async function getPanelUser(userId) {
  const { data } = await withRetry(() => api.get(`/users/${userId}`));
  return data?.attributes;
}

async function resetPanelUserPassword(userId) {
  const { data } = await withRetry(() => api.post(`/users/${userId}/password`));
  // Pterodactyl returns a new password in attributes or meta depending on version
  return data?.attributes?.password || data?.meta?.password || null;
}

async function updatePanelUser(userId, payload) {
  const { data } = await withRetry(() => api.patch(`/users/${userId}`, payload));
  return data?.attributes;
}

async function deletePanelUser(userId) {
  await withRetry(() => api.delete(`/users/${userId}`));
  return true;
}

async function checkUserExists(email, username) {
  try {
    // Check if email exists
    const emailResponse = await withRetry(() =>
      api.get(`/users?filter[email]=${encodeURIComponent(email)}`)
    );
    const emailExists = emailResponse.data?.data?.length > 0;

    // Check if username exists
    const usernameResponse = await withRetry(() =>
      api.get(`/users?filter[username]=${encodeURIComponent(username)}`)
    );
    const usernameExists = usernameResponse.data?.data?.length > 0;

    return { emailExists, usernameExists };
  } catch (error) {
    // If API is down, assume no conflicts to avoid blocking registration
    console.warn('Pterodactyl API unavailable for user validation:', error.message);
    return { emailExists: false, usernameExists: false };
  }
}

module.exports = {
  createPanelUser,
  getUserByExternalId,
  getUserWithServers,
  getEggDetails,
  getServer,
  updateServerDetails,
  updateServerBuild,
  deleteServer,
  getPanelUser,
  resetPanelUserPassword,
  updatePanelUser,
  deletePanelUser,
  checkUserExists,
  suspendServer,
  unsuspendServer
};
