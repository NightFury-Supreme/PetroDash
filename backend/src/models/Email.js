const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  smtp: {
    enabled: { type: Boolean, default: false },
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    fromEmail: { type: String, default: '' }
  },

}, {
  timestamps: true
});

// Ensure only one email settings document exists
emailSchema.statics.getOrCreate = async function() {
  const { getCache, setCache } = require('../lib/redis');
  const cacheKey = 'email:settings';
  
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  let doc = await this.findOne({});
  if (!doc) {
    doc = await this.create({});
  }
  
  await setCache(cacheKey, doc.toObject(), 300); // Cache for 5 minutes
  return doc;
};

module.exports = mongoose.model('Email', emailSchema);
