/**
 * Linkvertise anti-bypass verification and dynamic link utilities.
 */

const axios = require('axios');

function buildLinkvertiseUrl(template, targetUrl) {
  if (!template) return '';
  let url = template
    .replace(/\?o=sharing/g, '')
    .replace(/&o=sharing/g, '')
    .replace(/\/+$/, '');

  if (url.includes('/dynamic')) {
    url = url.split('/dynamic')[0];
  }

  const targetB64 = Buffer.from(targetUrl, 'utf8').toString('base64');
  const encodedTargetB64 = encodeURIComponent(targetB64);
  return url + '/dynamic?r=' + encodedTargetB64 + '&o=sharing';
}

function msgVerdict(msg) {
  const s = String(msg || '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'true' || s === 'ok' || s === 'success') return { ok: true, reason: s };
  if (s.includes('hash was found') || s.includes('found and deleted')) return { ok: true, reason: s };
  if (s.includes('authentication token not valid')) return { ok: false, reason: 'authentication token not valid' };
  if (s.includes('hash could not be found') || s.includes('hash not found')) return { ok: false, reason: 'hash not found' };
  return { ok: false, reason: s };
}

function isTruthy(data) {
  if (data === true || data === 1) return true;
  if (typeof data === 'string') {
    const s = data.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'ok' || s === 'success';
  }
  if (data && typeof data === 'object') {
    if (isTruthy(data.ok) || isTruthy(data.success) || isTruthy(data.valid) || isTruthy(data.verified)) return true;
    const msg1 = msgVerdict(data.response);
    if (msg1?.ok) return true;
    const msg2 = msgVerdict(data.result);
    if (msg2?.ok) return true;
    const msg3 = msgVerdict(data.message || data.msg || data.error || data.status);
    if (msg3?.ok) return true;
    if (data.data && typeof data.data === 'object') {
      if (isTruthy(data.data.ok) || isTruthy(data.data.success) || isTruthy(data.data.valid) || isTruthy(data.data.verified)) return true;
      const dmsg1 = msgVerdict(data.data.response);
      if (dmsg1?.ok) return true;
    }
  }
  return false;
}

async function verifyLinkvertiseHash(token, hash) {
  const t = String(token || '').trim();
  const h = String(hash || '').trim();
  if (!t || !h) return { ok: false, reason: 'missing_token_or_hash' };

  const baseUrl = 'https://publisher.linkvertise.com/api/v1/anti_bypassing';
  const baseHeaders = { 'User-Agent': 'PetroDash/1.0' };

  try {
    const p1 = axios.get(baseUrl, { params: { token: t, hash: h }, headers: { ...baseHeaders, Accept: 'application/json' }, timeout: 8000 });
    const p2 = axios.post(baseUrl, { token: t, hash: h }, { headers: { ...baseHeaders, Accept: 'application/json', 'Content-Type': 'application/json' }, timeout: 8000 });
    const p3 = axios.post(baseUrl, `token=${encodeURIComponent(t)}&hash=${encodeURIComponent(h)}`, { headers: { ...baseHeaders, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 });

    const results = await Promise.allSettled([p1, p2, p3]);
    let bestReason = 'verification failed';
    let anyNotFound = false;

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const d = r.value.data;
        if (isTruthy(d)) return { ok: true, reason: 'verified' };
        const m = msgVerdict(d?.response || d?.message || d?.error || d?.result);
        if (m) {
          if (m.ok) return m;
          if (m.reason.includes('not found')) anyNotFound = true;
          bestReason = m.reason;
        }
      } else if (r.reason?.response?.data) {
        const d = r.reason.response.data;
        if (isTruthy(d)) return { ok: true, reason: 'verified' };
        const m = msgVerdict(d?.response || d?.message || d?.error || d?.result);
        if (m) {
          if (m.ok) return m;
          if (m.reason.includes('not found')) anyNotFound = true;
          bestReason = m.reason;
        }
      }
    }
    if (anyNotFound) return { ok: false, reason: 'hash not found' };
    return { ok: false, reason: bestReason };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

module.exports = {
  buildLinkvertiseUrl,
  verifyLinkvertiseHash,
};
