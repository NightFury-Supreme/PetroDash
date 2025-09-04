const axios = require('axios');
const Settings = require('../models/Settings');

async function getAccessToken() {
  const s = await Settings.findOne({}).lean();
  const paypal = s?.payments?.paypal || {};
  if (!paypal.clientId || !paypal.clientSecret) throw new Error('PayPal not configured');
  const baseUrl = paypal.mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
  const res = await axios.post(
    `${baseUrl}/v1/oauth2/token`,
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, auth: { username: paypal.clientId, password: paypal.clientSecret } }
  );
  return { token: res.data.access_token, baseUrl, paypal, settings: s };
}

async function verifyWebhookSignature(headers, eventBody) {
  const { token, baseUrl } = await getAccessToken();
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const s = await Settings.findOne({}).lean();
  const webhookId = s?.payments?.paypal?.webhookId;
  if (!webhookId) throw new Error('Webhook not configured');
  const verifyRes = await axios.post(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: eventBody,
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return (verifyRes.data?.verification_status || '').toUpperCase() === 'SUCCESS';
}

module.exports = { getAccessToken, verifyWebhookSignature };



