const ShopItem = require('../models/ShopItem');

const PRESET_ITEMS = [
  {
    key: 'diskMb',
    name: 'Disk',
    unit: 'MB',
    amountPerUnit: 1024,
    pricePerUnit: 10,
    description: 'Increase disk space (in MB)'
  },
  {
    key: 'memoryMb',
    name: 'Memory',
    unit: 'MB',
    amountPerUnit: 512,
    pricePerUnit: 10,
    description: 'Increase memory (in MB)'
  },
  {
    key: 'cpuPercent',
    name: 'CPU',
    unit: '%',
    amountPerUnit: 10,
    pricePerUnit: 10,
    description: 'Increase CPU percentage'
  },
  {
    key: 'backups',
    name: 'Backups',
    unit: 'count',
    amountPerUnit: 1,
    pricePerUnit: 5,
    description: 'Increase backup slots'
  },
  {
    key: 'databases',
    name: 'Databases',
    unit: 'count',
    amountPerUnit: 1,
    pricePerUnit: 5,
    description: 'Increase database slots'
  },
  {
    key: 'allocations',
    name: 'Ports',
    unit: 'count',
    amountPerUnit: 1,
    pricePerUnit: 5,
    description: 'Increase port allocations'
  },
  {
    key: 'serverSlots',
    name: 'Server Slots',
    unit: 'count',
    amountPerUnit: 1,
    pricePerUnit: 20,
    description: 'Increase the number of servers you can create'
  }
];

async function ensureShopPresets() {
  for (const p of PRESET_ITEMS) {
    const exists = await ShopItem.findOne({ key: p.key });
    if (!exists) {
      await ShopItem.create({ ...p, enabled: true, maxPerPurchase: 100 });
    }
  }
}

module.exports = { ensureShopPresets, PRESET_ITEMS };
