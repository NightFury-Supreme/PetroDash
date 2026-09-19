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

  // --- Earn Settings & Integration ---
  'earn.linkvertise':         'Linkvertise Earn',
  'earn.ads':                 'Ads Earn',
  'earn.offerwall':           'Offerwall Earn',
  'earn.surveywall':          'Surveywall Earn',
  'earn.linkvertise.enabled': 'Linkvertise Enabled',
  'earn.linkvertise.url':     'Linkvertise URL',
  'earn.linkvertise.antiBypassToken': 'Linkvertise Anti-Bypass Token',
  'earn.ads.enabled':         'Ads Enabled',
  'earn.offerwall.enabled':   'Offerwall Enabled',
  'earn.surveywall.enabled':  'Surveywall Enabled',
  'earn.linkvertise.coins':   'Linkvertise Coins',
  'earn.ads.coins':           'Ads Coins',
  'earn.offerwall.coins':     'Offerwall Coins',
  'earn.surveywall.coins':    'Surveywall Coins',
  'earn.linkvertise.cooldownSeconds': 'Linkvertise Cooldown',
  'earn.ads.cooldownSeconds': 'Ads Cooldown',
  'earn.offerwall.cooldownSeconds': 'Offerwall Cooldown',
  'earn.surveywall.cooldownSeconds': 'Surveywall Cooldown',

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

/**
 * Human-readable labels for log actions.
 */
const ACTION_LABELS: Record<string, string> = {
  // Admin actions
  'admin.coupon.create': 'Create Coupon (Admin)',
  'admin.coupon.delete': 'Delete Coupon (Admin)',
  'admin.coupon.update': 'Update Coupon (Admin)',
  'admin.earn.update': 'Update Earn Settings (Admin)',
  'admin.egg_category.create': 'Create Egg Category (Admin)',
  'admin.egg_category.delete': 'Delete Egg Category (Admin)',
  'admin.egg_category.update': 'Update Egg Category (Admin)',
  'admin.egg.create': 'Create Egg (Admin)',
  'admin.egg.delete': 'Delete Egg (Admin)',
  'admin.egg.update': 'Update Egg (Admin)',
  'admin.email_settings.update': 'Update Email Settings (Admin)',
  'admin.gift.create': 'Create Gift (Admin)',
  'admin.gift.delete': 'Delete Gift (Admin)',
  'admin.gift.update': 'Update Gift (Admin)',
  'admin.location.create': 'Create Location (Admin)',
  'admin.location.delete': 'Delete Location (Admin)',
  'admin.location.update': 'Update Location (Admin)',
  'admin.payment.refund': 'Refund Payment (Admin)',
  'admin.payment.update': 'Update Payment (Admin)',
  'admin.payment.void': 'Void Payment (Admin)',
  'admin.plan.create': 'Create Plan (Admin)',
  'admin.plan.delete': 'Delete Plan (Admin)',
  'admin.plan.update': 'Update Plan (Admin)',
  'admin.server.delete': 'Delete Server (Admin)',
  'admin.server.queue.clear': 'Clear Server Queue (Admin)',
  'admin.server.update': 'Update Server (Admin)',
  'admin.settings.tickets.update': 'Update Ticket Settings (Admin)',
  'admin.settings.update': 'Update Settings (Admin)',
  'admin.shop.update': 'Update Shop (Admin)',
  'admin.ticket.delete': 'Delete Ticket (Admin)',
  'admin.ticket.reply': 'Reply to Ticket (Admin)',
  'admin.ticket.update': 'Update Ticket (Admin)',
  'admin.user.ban': 'Ban User (Admin)',
  'admin.user.unban': 'Unban User (Admin)',
  'admin.user.delete': 'Delete User (Admin)',
  'admin.user.plan.add': 'Add Plan to User (Admin)',
  'admin.user.plan.cancel': 'Cancel User Plan (Admin)',
  'admin.user.plan.instance.cancel': 'Cancel Plan Instance (Admin)',
  'admin.user.server.delete': 'Delete User Server (Admin)',
  'admin.user.server.update': 'Update User Server (Admin)',
  'admin.user.update': 'Update User (Admin)',

  // Auth actions
  'auth.2fa.disable': 'Disable 2FA',
  'auth.2fa.enable': 'Enable 2FA',
  'auth.account.delete': 'Delete Account',
  'auth.account.update': 'Update Account',
  'auth.email.update': 'Update Email',
  'auth.email.verified': 'Verify Email',
  'auth.login.error': 'Login Error',
  'auth.login.failed': 'Login Failed',
  'auth.login.success': 'Login Success',
  'auth.logout': 'Logout',
  'auth.logout.error': 'Logout Error',
  'auth.oauth.discord.error': 'Discord Auth Error',
  'auth.oauth.discord.failed': 'Discord Auth Failed',
  'auth.oauth.discord.initiated': 'Initiate Discord Auth',
  'auth.oauth.discord.success': 'Discord Auth Success',
  'auth.oauth.google.error': 'Google Auth Error',
  'auth.oauth.google.failed': 'Google Auth Failed',
  'auth.oauth.google.initiated': 'Initiate Google Auth',
  'auth.oauth.google.success': 'Google Auth Success',
  'auth.password.reset.requested': 'Password Reset Requested',
  'auth.password.reset.success': 'Password Reset Success',
  'auth.password.update': 'Update Password',
  'auth.register.failed': 'Registration Failed',
  'auth.register.success': 'Registration Success',
  'auth.session.revoke': 'Revoke Session',

  // Earn & Referral
  'earn.ad.verified': 'Ad Verified',
  'earn.callback.claim': 'Earn Callback Claim',
  'earn.claim': 'Earn Claim',
  'earn.session.start': 'Start Earn Session',
  'earn.linkvertise': 'Earn via Linkvertise',
  'referral.code.update': 'Update Referral Code',
  'referral.reward.referred': 'Referred Reward Claimed',
  'referral.reward.referrer': 'Referrer Reward Claimed',

  // System & Shop
  'gift.redeem': 'Redeem Gift',
  'payment.purchase.completed': 'Purchase Completed',
  'shop.payment.cancel': 'Cancel Payment',
  'shop.payment.capture': 'Capture Payment',
  'shop.payment.create': 'Create Payment',
  'shop.purchase': 'Shop Purchase',

  // User resources
  'server.create': 'Create Server',
  'server.delete': 'Delete Server',
  'server.update': 'Update Server',
  'ticket.create': 'Create Ticket',
  'ticket.reply': 'Reply to Ticket',
  'ticket.status_change': 'Change Ticket Status',
};

/**
 * Resolve an action to its human-readable label.
 */
export function getActionLabel(action: string): string {
  if (!action) return '';
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  
  // Fallback string manipulation if completely unknown
  return action
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
