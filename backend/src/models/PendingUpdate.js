const mongoose = require('mongoose');

const PendingUpdateSchema = new mongoose.Schema(
  {
    pterodactylUserId: { type: Number, required: true },
    payload: { type: String, required: true }, // Stored as JSON string
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingUpdate', PendingUpdateSchema);
