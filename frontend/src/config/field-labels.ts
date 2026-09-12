/**
 * Human-readable labels for log field paths.
 * Keys are the exact field path as stored in the database (dot-notation for nested).
 * Add new entries here whenever a new field is logged.
 */
const FIELD_LABELS: Record<string, string> = {
  // --- Server & User Resources ---
  'limits.diskMb':       'Disk (MB)',
  'limits.memoryMb':     'Memory (MB)',
  'limits.cpu':          'CPU (%)',
  'limits.cpuPercent':   'CPU (%)',
  'limits.databases':    'Databases',
  'limits.allocations':  'Allocations',
  'limits.backups':      'Backups',
  'limits.swap':         'Swap (MB)',
  'limits.io':           'IO Weight',
  'cpuPercent':          'CPU (%)',
  'diskMb':              'Disk (MB)',
  'memoryMb':            'Memory (MB)',
  'databases':           'Databases',
  'allocations':         'Allocations',
  'backups':             'Backups',
  'serverSlots':         'Server Slots',

  // --- Auth / Account ---
  'email':               'Email Address',
  'password':            'Password',
  'tfaEnabled':          'Two-Factor Auth',
  'tfaSecret':           '2FA Secret',
  'tfaBackupCodes':      '2FA Backup Codes',
  'emailVerified':       'Email Verified',
  'username':            'Username',
  'firstName':           'First Name',
  'lastName':            'Last Name',
  'role':                'Role',
  'suspended':           'Suspended',
  'coins':               'Coins',
  'profilePicture':      'Profile Picture',
  'isBanned':            'Banned Status',
  'reason':              'Ban Reason',
  'until':               'Ban Until',

  // --- Ticket fields ---
  'status':              'Status',
  'subject':             'Subject',
  'category':            'Category',
  'priority':            'Priority',
  'message':             'Message',

  // --- Shop, Referrals, & Plans ---
  'code':                'Referral Code',
  'planName':            'Plan',
  'itemName':            'Item',
  'amount':              'Amount',
  'price':               'Price',
  'name':                'Name',
  'description':         'Description',
  'strikeThroughPrice':  'Original Price',
  'pricePerMonth':       'Monthly Price',
  'pricePerYear':        'Yearly Price',
  'visibility':          'Visibility',
  'stock':               'Stock',
  'limitPerCustomer':    'Customer Limit',
  'redirectionLink':     'Checkout Link',
  'renewable':           'Renewable',

  // --- Meta, Infrastructure & IDs ---
  'serverId':            'Server ID',
  'serverName':          'Server Name',
  'panelServerId':       'Panel Server ID',
  'eggId':               'Egg ID',
  'locationId':          'Location ID',
  'userId':              'User ID',
  'actorId':             'Actor ID',
  'actorRole':           'Actor Role',
  'actorUsername':       'Actor',
  'targetUserId':        'Target User ID',
  'updatedByAdmin':      'Updated By Admin',
  'method':              'Method',
  'path':                'Path',
  'statusCode':          'Status Code',
  'durationMs':          'Duration (ms)',
  'ip':                  'IP Address',
  'userAgent':           'User Agent',
  'sessionId':           'Session ID',
  'dbId':                'Database ID',
  // --- Earn Settings ---
  'earn.enabled':        'Earn Enabled',
  'earn.linkvertise':    'Linkvertise Settings',
  'earn.admob':          'AdMob Settings',
  'earn.ayet':           'Ayet Studios Settings',
  'earn.lootably':       'Lootably Settings',
};

/**
 * Resolve a field path to its human-readable label.
 * Falls back to the raw key if no mapping is found.
 */
export function getFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  // Try just the last segment as a fallback
  const leaf = key.split('.').pop() || key;
  if (FIELD_LABELS[leaf]) return FIELD_LABELS[leaf];

  // Last resort: return the raw key unchanged
  return key;
}

/**
 * Human-readable labels for log categories.
 */
const CATEGORY_LABELS: Record<string, string> = {
  'auth': 'Authentication',
  'server_management': 'Server Management',
  'user_management': 'User Management',
  'admin_activity': 'Admin Activity',
  'user_activity': 'User Activity',
  'billing_event': 'Billing Event',
  'data_access': 'Data Access',
  'system_event': 'System Event',
  'policy_denied': 'Policy Denied',
  'system': 'System',
  'security': 'Security',
  'billing': 'Billing',
  'shop': 'Shop',
  'tickets': 'Tickets',
};

/**
 * Resolve a category to its human-readable label.
 */
export function getCategoryLabel(cat: string): string {
  if (!cat) return '';
  return CATEGORY_LABELS[cat] || cat;
}
