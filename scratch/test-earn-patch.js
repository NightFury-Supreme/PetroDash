const mongoose = require('mongoose');
const Settings = require('../backend/src/models/Settings');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pterodash');
  let settings = await Settings.findOne({});
  console.log('Settings found?', !!settings);
  if (!settings) settings = new Settings();
  settings.earn = settings.earn || {};
  settings.earn.linkvertise = settings.earn.linkvertise || {};
  settings.earn.linkvertise.enabled = false;
  
  settings.markModified('earn');
  await settings.save();
  console.log('Saved');
  
  const obj = settings.toObject();
  console.log('toObject earn:', obj.earn);
  process.exit(0);
}
test().catch(console.error);
