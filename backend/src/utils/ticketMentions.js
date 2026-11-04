const Server = require('../models/Server');
const Payment = require('../models/Payment');
const { isValidEntityId } = require('./publicId');

async function sanitizeTicketMentions(body, userId) {
  let sanitizedBody = body;
  
  if (!sanitizedBody || typeof sanitizedBody !== 'string') return sanitizedBody;

  const serverMentions = [...sanitizedBody.matchAll(/\[@server:([a-zA-Z0-9_-]+):([^\]]+)\]/g)];
  if (serverMentions.length > 0) {
    const serverIds = serverMentions.map(m => m[1]);
    const validCandidateIds = serverIds.filter(id => isValidEntityId(id, 'server'));
    
    const validServers = validCandidateIds.length > 0
      ? await Server.find({
          publicId: { $in: validCandidateIds },
          owner: userId,
        }).select('publicId').lean()
      : [];
    
    const validIds = new Set(validServers.map(s => s.publicId).filter(Boolean));
    
    sanitizedBody = sanitizedBody.replace(/\[@server:([a-zA-Z0-9_-]+):([^\]]+)\]/g, (match, id, name) => {
      if (!validIds.has(id)) return `[Invalid Server: ${name}]`;
      return match;
    });
  }

  const invoiceMentions = [...sanitizedBody.matchAll(/\[@invoice:([a-zA-Z0-9_-]+):([^\]]+)\]/g)];
  if (invoiceMentions.length > 0) {
    const invoiceIds = invoiceMentions.map(m => m[1]);
    const validCandidateIds = invoiceIds.filter(id => isValidEntityId(id, 'payment'));
    
    const validInvoices = validCandidateIds.length > 0
      ? await Payment.find({
          publicId: { $in: validCandidateIds },
          userId,
        }).select('publicId').lean()
      : [];
    
    const validIds = new Set(validInvoices.map(p => p.publicId).filter(Boolean));
    
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
