const crypto = require('crypto');

const ID_PREFIXES = {
  user: 'usr',
  server: 'srv',
  ticket: 'tkt',
  message: 'msg',
  plan: 'pln',
  location: 'loc',
  egg: 'egg',
  gift: 'gft',
  coupon: 'cpn',
  payment: 'pay',
  subscription: 'sub',
  userplan: 'upl',
  userPlan: 'upl',
  plancategory: 'pcat',
  planCategory: 'pcat',
  eggcategory: 'ecat',
  eggCategory: 'ecat',
  usersession: 'ses',
  userSession: 'ses',
  earnsession: 'esn',
  earnSession: 'esn',
  auditlog: 'aud',
  auditLog: 'aud',
};

function resolvePrefix(entityTypeOrPrefix) {
  if (!entityTypeOrPrefix) return 'obj';
  const raw = String(entityTypeOrPrefix).trim();
  const lower = raw.toLowerCase();
  return ID_PREFIXES[raw] || ID_PREFIXES[lower] || lower;
}

function generatePublicId(entityTypeOrPrefix) {
  const prefix = resolvePrefix(entityTypeOrPrefix);
  const randomPart = crypto.randomBytes(10).toString('hex');
  return `${prefix}_${randomPart}`;
}

function isValidPublicId(id, expectedTypeOrPrefix = null) {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (expectedTypeOrPrefix) {
    const prefix = resolvePrefix(expectedTypeOrPrefix);
    const regex = new RegExp(`^${prefix}_[0-9a-f]{20}$`, 'i');
    return regex.test(trimmed);
  }
  return /^[a-z]{3,4}_[0-9a-f]{20}$/i.test(trimmed);
}

function isValidEntityId(id, expectedTypeOrPrefix = null) {
  return isValidPublicId(id, expectedTypeOrPrefix);
}

function buildIdFilter(id) {
  if (!id) return { publicId: null };
  return { publicId: String(id).trim() };
}

function formatPublicEntity(doc, entityTypeOrPrefix = null) {
  if (!doc) return doc;
  if (Array.isArray(doc)) {
    return doc
      .map((item) => formatPublicEntity(item, entityTypeOrPrefix))
      .filter((item) => item !== null && item !== undefined);
  }
  if (typeof doc === 'string' && /^[0-9a-fA-F]{24}$/.test(doc)) {
    return null;
  }
  if (typeof doc !== 'object') return doc;
  if (doc instanceof Date || doc instanceof RegExp || Buffer.isBuffer(doc)) return doc;
  if (doc._bsontype === 'ObjectID' || doc.constructor?.name === 'ObjectId') {
    return null;
  }

  const raw = typeof doc.toObject === 'function' ? doc.toObject() : (doc._doc ? { ...doc._doc } : { ...doc });
  const { _id, __v, publicId: _rawPubId, ...rest } = raw;
  const entityId = raw.publicId || (typeof raw.id === 'string' && isValidPublicId(raw.id) ? raw.id : null);

  const formatted = {
    ...rest,
    ...(entityId ? { id: entityId } : {}),
  };

  delete formatted._id;
  delete formatted.__v;
  delete formatted.publicId;

  for (const key of Object.keys(formatted)) {
    const val = formatted[key];
    if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
      delete formatted[key];
      continue;
    }
    if (val && typeof val === 'object' && !(val instanceof Date) && !(val instanceof RegExp) && !Buffer.isBuffer(val)) {
      if (val._bsontype === 'ObjectID' || val.constructor?.name === 'ObjectId') {
        delete formatted[key];
      } else if (Array.isArray(val)) {
        formatted[key] = val
          .map((item) => (item && typeof item === 'object' ? formatPublicEntity(item) : (typeof item === 'string' && /^[0-9a-fA-F]{24}$/.test(item) ? null : item)))
          .filter((item) => item !== null && item !== undefined);
      } else {
        formatted[key] = formatPublicEntity(val);
      }
    }
  }

  delete formatted._id;
  delete formatted.__v;
  delete formatted.publicId;

  return formatted;
}

module.exports = {
  ID_PREFIXES,
  generatePublicId,
  isValidPublicId,
  isValidEntityId,
  buildIdFilter,
  formatPublicEntity,
};
