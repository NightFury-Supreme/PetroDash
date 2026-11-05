const axios = require('axios');
const http = require('http');
const https = require('https');
const CircuitBreaker = require('../utils/circuitBreaker');
const TokenBucketLimiter = require('../utils/tokenBucketLimiter');

const rawPanelBase = (process.env.PTERO_BASE_URL || '').trim();
const PANEL_BASE = rawPanelBase.replace(/\/$/, '');
const APP_KEY = (process.env.PTERO_APP_API_KEY || '').trim();

const httpAgent = new http.Agent({ keepAlive: true, family: 4 });
const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });

const api = axios.create({
  baseURL: PANEL_BASE ? `${PANEL_BASE}/api/application` : undefined,
  headers: {
    Authorization: `Bearer ${APP_KEY}`,
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  httpAgent,
  httpsAgent,
});

const breaker = new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 });
const limiter = new TokenBucketLimiter({ capacity: 180, refillRate: 3 });

async function withRetry(fn, { retries = 1, delayMs = 250 } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.response?.status;
      const isNetwork = !status;
      const retryable = isNetwork || (status >= 500 && status < 600) || status === 429;
      if (!retryable || attempt === retries) {
        throw e;
      }
      const retryAfter = Number(e?.response?.headers?.['retry-after']);
      const waitTime = !isNaN(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 2000)
        : delayMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, waitTime));
      attempt += 1;
      lastErr = e;
    }
  }
  throw lastErr;
}

async function executePanelRequest(fn, options) {
  await limiter.acquire(1);
  return breaker.execute(() => withRetry(fn, options));
}

async function createPanelUser({ email, username, firstName, lastName, password }) {
  const payload = {
    email,
    username,
    first_name: firstName,
    last_name: lastName,
    password,
  };
  const { data } = await executePanelRequest(() => api.post('/users', payload));
  return data?.attributes;
}

async function getUserByExternalId(externalId) {
  const { data } = await executePanelRequest(() => api.get(`/users/external/${encodeURIComponent(externalId)}`));
  return data?.attributes;
}

async function getUserWithServers(userId) {
  const { data } = await executePanelRequest(() => api.get(`/users/${userId}?include=servers`));
  return data;
}

async function getEggDetails(nestId, eggId) {
  const { getCache, setCache } = require('../lib/redis');
  const cacheKey = `ptero:egg:${eggId}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let attributes;
  const targetEggId = Number(eggId);
  const targetNestId = Number(nestId);

  if (targetNestId > 0) {
    try {
      const { data } = await executePanelRequest(() => api.get(`/nests/${targetNestId}/eggs/${targetEggId}?include=variables,nest`));
      attributes = data?.attributes;
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
    }
  }

  if (!attributes) {
    try {
      const { data } = await executePanelRequest(() => api.get(`/eggs/${targetEggId}?include=variables,nest`));
      attributes = data?.attributes;
    } catch (err) {
      if (err?.response?.status !== 404) throw err;
    }
  }

  if (!attributes) {
    try {
      const { data: nestsList } = await executePanelRequest(() => api.get('/nests?include=eggs'));
      for (const nest of (nestsList?.data || [])) {
        const found = nest.relationships?.eggs?.data?.find(e => Number(e.attributes?.id) === targetEggId);
        if (found) {
          const discoveredNestId = nest.attributes?.id;
          const { data } = await executePanelRequest(() => api.get(`/nests/${discoveredNestId}/eggs/${targetEggId}?include=variables,nest`));
          attributes = data?.attributes;
          break;
        }
      }
    } catch (_nestErr) {}
  }

  if (attributes) {
    await setCache(cacheKey, attributes, 900);
  }
  return attributes;
}

async function getServer(serverId) {
  const { data } = await executePanelRequest(() => api.get(`/servers/${serverId}?include=allocations,node,location,user,egg`));
  return data;
}

async function getAllServers() {
  const { data } = await executePanelRequest(() => api.get('/servers?include=allocations,node,location,user,egg&per_page=100'));
  let servers = data?.data || [];
  const totalPages = data?.meta?.pagination?.total_pages || 1;
  if (totalPages > 1) {
    for (let page = 2; page <= totalPages; page++) {
      const pageRes = await executePanelRequest(() => api.get(`/servers?include=allocations,node,location,user,egg&per_page=100&page=${page}`));
      const pageData = pageRes?.data?.data || [];
      servers = servers.concat(pageData);
    }
  }
  return servers;
}

async function updateServerDetails(serverId, { name, user, external_id, description }) {
  const payload = { name, user };
  if (description !== undefined) {
    payload.description = description;
  }
  if (external_id !== undefined) {
    payload.external_id = external_id;
  }
  const { data } = await executePanelRequest(() => api.patch(`/servers/${serverId}/details`, payload));
  return data?.attributes;
}

async function updateServerBuild(serverId, { allocation, memory, swap = 0, disk, io = 500, cpu, databases, allocations, backups }) {
  const payload = {
    allocation,
    memory,
    swap,
    disk,
    io,
    cpu,
    feature_limits: { databases, allocations, backups },
  };
  const { data } = await executePanelRequest(() => api.patch(`/servers/${serverId}/build`, payload));
  return data?.attributes;
}

async function deleteServer(serverId) {
  await executePanelRequest(() => api.delete(`/servers/${serverId}`));
  return true;
}

async function forceDeleteServer(serverId) {
  await executePanelRequest(() => api.delete(`/servers/${serverId}`, { params: { force: 'true' } }));
  return true;
}

async function suspendServer(serverId) {
  await executePanelRequest(() => api.post(`/servers/${serverId}/suspend`));
  return true;
}

async function unsuspendServer(serverId) {
  await executePanelRequest(() => api.post(`/servers/${serverId}/unsuspend`));
  return true;
}

async function getPanelUser(userId) {
  const { getCache, setCache } = require('../lib/redis');
  const cacheKey = `ptero:user:${userId}`;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const { data } = await executePanelRequest(() => api.get(`/users/${userId}`));
  const attributes = data?.attributes;

  if (attributes) {
    await setCache(cacheKey, attributes, 60);
  }
  return attributes;
}

async function resetPanelUserPassword(userId) {
  const { data } = await executePanelRequest(() => api.post(`/users/${userId}/password`));
  return data?.attributes?.password || data?.meta?.password || null;
}

async function updatePanelUser(userId, payload) {
  const { data } = await executePanelRequest(() => api.patch(`/users/${userId}`, payload));
  const { deleteCache } = require('../lib/redis');
  await deleteCache(`ptero:user:${userId}`);
  return data?.attributes;
}

async function deletePanelUser(userId) {
  await executePanelRequest(() => api.delete(`/users/${userId}`));
  return true;
}

async function findPanelUser(email, username) {
  for (const [key, val] of [['email', email], ['username', username]]) {
    if (!val) continue;
    try {
      const res = await executePanelRequest(() => api.get(`/users?filter[${key}]=${encodeURIComponent(val)}`));
      const found = (res.data?.data || []).find(u => u?.attributes?.[key]?.toLowerCase() === val.toLowerCase());
      if (found?.attributes) return found.attributes;
    } catch (e) {
      const status = e?.response?.status;
      if (!status || (status >= 500 && status < 600)) throw e;
    }
  }
  return null;
}

async function checkUserExists(email, username, excludeId = null) {
  try {
    let emailExists = false;
    let usernameExists = false;
    if (email) {
      const res = await executePanelRequest(() => api.get(`/users?filter[email]=${encodeURIComponent(email)}`));
      emailExists = (res.data?.data || []).some(u => u.attributes.email.toLowerCase() === email.toLowerCase() && u.attributes.id !== excludeId);
    }
    if (username) {
      const res = await executePanelRequest(() => api.get(`/users?filter[username]=${encodeURIComponent(username)}`));
      usernameExists = (res.data?.data || []).some(u => u.attributes.username.toLowerCase() === username.toLowerCase() && u.attributes.id !== excludeId);
    }
    return { emailExists, usernameExists };
  } catch (_checkErr) {
    return { emailExists: false, usernameExists: false };
  }
}

async function createPanelServer(payload) {
  const { data } = await executePanelRequest(() => api.post('/servers', payload, { timeout: 30000 }));
  return data?.attributes;
}

module.exports = {
  createPanelUser,
  createPanelServer,
  getUserByExternalId,
  getUserWithServers,
  getEggDetails,
  getServer,
  getAllServers,
  updateServerDetails,
  updateServerBuild,
  deleteServer,
  forceDeleteServer,
  getPanelUser,
  resetPanelUserPassword,
  updatePanelUser,
  deletePanelUser,
  findPanelUser,
  checkUserExists,
  suspendServer,
  unsuspendServer,
};
