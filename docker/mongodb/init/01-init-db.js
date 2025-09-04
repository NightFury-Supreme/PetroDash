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

// Create default admin user (password: admin123)
db.users.insertOne({
  email: "admin@example.com",
  username: "admin",
  firstName: "Admin",
  lastName: "User",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admin123
  role: "admin",
  coins: 0,
  resources: {
    cpuPercent: 0,
    memoryMb: 0,
    diskMb: 0,
    swapMb: -1,
    blockIoProportion: 0,
    cpuPinning: "",
    additionalAllocations: 0,
    databases: 0,
    backups: 0,
    serverSlots: 0
  },
  serverCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create default settings
db.settings.insertOne({
  siteName: "PteroDash",
  siteIconUrl: "",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("PteroDash database initialized successfully!");
