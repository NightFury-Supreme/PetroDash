const Server = require('../models/Server');
const Payment = require('../models/Payment');

async function sanitizeTicketMentions(body, userId) {
  let sanitizedBody = body;
  
  if (!sanitizedBody || typeof sanitizedBody !== 'string') return sanitizedBody;

  // Validate server mentions
  const serverMentions = [...sanitizedBody.matchAll(/\[@server:([a-zA-Z0-9_-]+):([^\]]+)\]/g)];
  if (serverMentions.length > 0) {
    const serverIds = serverMentions.map(m => m[1]);
    
    const validServers = await Server.find({ _id: { $in: serverIds }, owner: userId }).select('_id').lean();
    
    const validIds = new Set(validServers.map(s => String(s._id)));
    
    sanitizedBody = sanitizedBody.replace(/\[@server:([a-zA-Z0-9_-]+):([^\]]+)\]/g, (match, id, name) => {
      if (!validIds.has(id)) return `[Invalid Server: ${name}]`;
      return match;
    });
  }

  // Validate invoice mentions
  const invoiceMentions = [...sanitizedBody.matchAll(/\[@invoice:([a-zA-Z0-9_-]+):([^\]]+)\]/g)];
  if (invoiceMentions.length > 0) {
    const invoiceIds = invoiceMentions.map(m => m[1]);
    
    const validInvoices = await Payment.find({ _id: { $in: invoiceIds }, userId: userId }).select('_id').lean();
    
    const validIds = new Set(validInvoices.map(p => String(p._id)));
    
    sanitizedBody = sanitizedBody.replace(/\[@invoice:([a-zA-Z0-9_-]+):([^\]]+)\]/g, (match, id, name) => {
      if (!validIds.has(id)) return `[Invalid Invoice: ${name}]`;
      return match;
    });
  }
  
  return sanitizedBody;
}

module.exports = {
  sanitizeTicketMentions
};
