const { sendMailTemplate } = require('../../lib/mail');

function serializeAuthUser(user) {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    coins: Number(user.coins || 0),
    pterodactylUserId: user.pterodactylUserId || null,
    resources: user.resources,
  };
}

async function sendLoginAlert(user, req) {
  try {
    await sendMailTemplate({
      to: user.email,
      templateKey: 'loginAlert',
      data: {
        ip: req.ip,
        userAgent: req.get('User-Agent') || '',
        time: new Date().toISOString(),
        username: user.username,
      },
    });
  } catch (_) {
    // Non-blocking email alert failure ignored
  }
}

module.exports = {
  serializeAuthUser,
  sendLoginAlert,
};
