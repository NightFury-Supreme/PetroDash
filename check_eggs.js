const mongoose = require('mongoose');
const Egg = require('./backend/src/models/Egg');
require('dotenv').config({ path: './backend/.env' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const eggs = await Egg.find({});
  console.log(eggs.map(e => ({ name: e.name, allowedPlans: e.allowedPlans })));
  process.exit(0);
});
