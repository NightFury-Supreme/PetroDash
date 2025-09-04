// MongoDB initialization script for PteroDash
db = db.getSiblingDB('pterodash');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('servers');
db.createCollection('plans');
db.createCollection('userplans');
db.createCollection('eggs');
db.createCollection('locations');
db.createCollection('settings');
db.createCollection('auditlogs');
db.createCollection('coupons');
db.createCollection('webhookevents');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "pterodactylUserId": 1 }, { unique: true });

db.servers.createIndex({ "owner": 1 });
db.servers.createIndex({ "locationId": 1 });
db.servers.createIndex({ "pterodactylServerId": 1 }, { unique: true });

db.userplans.createIndex({ "userId": 1, "status": 1 });
db.userplans.createIndex({ "planId": 1 });
db.userplans.createIndex({ "expiresAt": 1 });

db.auditlogs.createIndex({ "timestamp": 1 });
db.auditlogs.createIndex({ "userId": 1 });
db.auditlogs.createIndex({ "action": 1 });

db.coupons.createIndex({ "code": 1 }, { unique: true });
db.webhookevents.createIndex({ "eventId": 1 }, { unique: true });

// Create default settings
db.settings.insertOne({
  siteName: "PteroDash",
  siteIconUrl: "",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("PteroDash database initialized successfully!");
