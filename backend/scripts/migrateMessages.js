const mongoose = require('mongoose');
require('dotenv').config();

const Ticket = require('../src/models/Ticket');
const TicketMessage = require('../src/models/TicketMessage');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  let migrated = 0;
  
  // We use the strict: false query to bypass mongoose schema checking
  // since we just removed `messages` from the schema.
  // Alternatively, we use native mongo collection.
  const collection = mongoose.connection.collection('tickets');
  
  const cursor = collection.find({ messages: { $exists: true, $not: { $size: 0 } } });
  
  let batch = [];
  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    
    if (doc.messages && Array.isArray(doc.messages)) {
      for (const msg of doc.messages) {
        batch.push({
          ticket: doc._id,
          author: msg.author,
          authorRole: msg.authorRole,
          body: msg.body,
          internal: msg.internal || false,
          createdAt: msg.createdAt || new Date(),
          _id: msg._id // Preserve original ID if it exists
        });
      }
    }
    
    // Unset the embedded messages array so we don't migrate again
    await collection.updateOne({ _id: doc._id }, { $unset: { messages: "" } });
    
    if (batch.length >= 500) {
      await TicketMessage.insertMany(batch, { ordered: false }).catch(e => {
        // Ignore duplicate key errors if already migrated
        if (e.code !== 11000) console.error(e);
      });
      migrated += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await TicketMessage.insertMany(batch, { ordered: false }).catch(e => {
      if (e.code !== 11000) console.error(e);
    });
    migrated += batch.length;
  }

  console.log(`Migrated ${migrated} messages successfully.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
