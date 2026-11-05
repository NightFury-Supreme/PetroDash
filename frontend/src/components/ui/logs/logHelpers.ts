import type { LogMeta, DiffValue } from './logTypes';

export const META_SYSTEM_KEYS = new Set([
  'changes',
  'changed',
  'created',
  'sessionId',
  'ip',
  'userAgent',
  'location',
  'method',
  'path',
  'status',
  'statusCode',
  'durationMs',
  'targetName',
  'targetRole',
  'actorId',
  'actorRole',
  'actorUsername',
  'username',
  'role',
  'targetUserId',
  'userId',
  'body',
  'responsePreview',
  'requestId',
  'success',
  'targetUsername',
  'targetEmail',
  'banUntil',
  'durationMinutes',
  'permanent',
  'reason',
  'name',
  'serverName',
  'planName',
  'plan',
  'subject',
  'ticketTitle',
  'itemName',
  'code',
  'serverId',
  'duration',
  'suspendedUntil',
  'description',
  'category',
  'adminUsername',
  'adminRole',
  'adminId',
  'performedByStaff',
  'suspendedByAdmin',
  'ownerId',
  'targetServerId',
  'isSuspended',
]);

export const CONTEXT_META_KEYS: Array<keyof LogMeta> = [
  'serverName',
  'name',
  'planName',
  'plan',
  'subject',
  'ticketTitle',
  'itemName',
  'code',
  'reason',
];

export function cleanIp(rawIp?: string | null): string | null {
  if (!rawIp || typeof rawIp !== 'string') return null;
  if (rawIp === '::1') return '127.0.0.1';
  if (rawIp.startsWith('::ffff:')) return rawIp.replace('::ffff:', '');
  return rawIp;
}

export function resolveCategoryTranslation(
  category: string,
  uiMessages: Record<string, unknown> | undefined
): string {
  const catKey = `cat_${category}`;
  if (uiMessages && typeof uiMessages[catKey] === 'string') {
    return uiMessages[catKey] as string;
  }
  return formatKeyToLabel(category);
}

export function formatKeyToLabel(rawKey: string): string {
  const leaf = rawKey.split('.').pop() || rawKey;
  return leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_.-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatReason(
  reason?: string | null,
  reasonsMessages?: Record<string, unknown> | null
): string {
  if (!reason || typeof reason !== 'string') return '';
  const trimmed = reason.trim();
  const parenIdx = trimmed.indexOf('(');
  const baseKey = (parenIdx > -1 ? trimmed.slice(0, parenIdx) : trimmed).trim();
  const extraSuffix = parenIdx > -1 ? trimmed.slice(parenIdx).trim() : '';

  if (reasonsMessages && typeof reasonsMessages[baseKey] === 'string') {
    const translated = reasonsMessages[baseKey] as string;
    return extraSuffix ? `${translated} ${extraSuffix}` : translated;
  }

  const formattedBase = formatKeyToLabel(baseKey);
  return extraSuffix ? `${formattedBase} ${extraSuffix}` : formattedBase;
}

export function parseUserAgent(ua?: string, unknownLabel: string = 'Unknown'): string {
  if (!ua || typeof ua !== 'string') return unknownLabel;
  const trimmed = ua.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed === '-') return unknownLabel;

  const browsers: [string, string][] = [
    ['Edg', 'Edge'],
    ['Edge', 'Edge'],
    ['Firefox', 'Firefox'],
    ['Chrome', 'Chrome'],
    ['Safari', 'Safari'],
    ['Opera', 'Opera'],
    ['OPR', 'Opera'],
    ['Brave', 'Brave'],
    ['Vivaldi', 'Vivaldi'],
  ];
  const oses: [string, string][] = [
    ['Windows', 'Windows'],
    ['Android', 'Android'],
    ['iPhone', 'iOS'],
    ['iPad', 'iOS'],
    ['iOS', 'iOS'],
    ['Macintosh', 'macOS'],
    ['Mac OS', 'macOS'],
    ['Linux', 'Linux'],
    ['CrOS', 'ChromeOS'],
  ];

  const browser = browsers.find(([token]) => trimmed.includes(token))?.[1];
  const os = oses.find(([token]) => trimmed.includes(token))?.[1];

  if (!os && !browser) return unknownLabel;
  if (!os) return browser!;
  if (!browser) return os;

  return `${os} • ${browser}`;
}

export function isEntityId(str: string): boolean {
  return /^[a-z]{3,4}_[0-9a-f]{20}$/i.test(str);
}

export function isDiffValue(value: unknown): value is DiffValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('old' in value || 'new' in value)
  );
}

export function isLegacyDiffString(value: unknown): value is string {
  return typeof value === 'string' && value.includes('->');
}

export function formatBanDuration(
  meta: LogMeta,
  tCommon: (key: string) => string
): string | null {
  if (meta.permanent) return tCommon('permanent');
  if (meta.durationMinutes != null) {
    const mins = Number(meta.durationMinutes);
    if (mins < 60) return `${mins} ${tCommon('minutes')}`;
    if (mins < 1440) return `${Math.round(mins / 60)} ${tCommon('hours')}`;
    return `${Math.round(mins / 1440)} ${tCommon('days')}`;
  }
  return null;
}

export function formatSuspendDuration(
  meta: LogMeta,
  createdAt: string,
  tCommon: (key: string) => string
): string | null {
  if (!meta.suspendedUntil || meta.duration === 'permanent' || meta.duration === 'lifetime') {
    return tCommon('permanent');
  }
  const diffMs = new Date(meta.suspendedUntil as string).getTime() - new Date(createdAt).getTime();
  if (diffMs <= 0) return tCommon('permanent');
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)} ${tCommon('minutes')}`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} ${tCommon('hours')}` : `${Math.round(hours / 24)} ${tCommon('days')}`;
}

export function resolveResourceDisplays(
  log: { resourceType?: string | null; resourceId?: string | null },
  meta: LogMeta
): {
  serverDisplay: string | null;
  ticketDisplay: string | null;
  planDisplay: string | null;
  itemDisplay: string | null;
  codeDisplay: string | null;
} {
  const serverId = (meta.serverId || (log.resourceType === 'server' ? log.resourceId : null)) as string | null | undefined;
  const serverName = (meta.serverName || meta.name || (log.resourceType === 'server' ? meta.targetName : null)) as string | null | undefined;
  const serverDisplay = serverId && serverName
    ? `${serverName} (${serverId})`
    : serverName || serverId || null;

  const ticketId = (meta.ticketId || (log.resourceType === 'ticket' ? log.resourceId : null)) as string | null | undefined;
  const ticketTitle = (meta.ticketTitle || meta.subject || (log.resourceType === 'ticket' ? meta.targetName : null)) as string | null | undefined;
  const ticketDisplay = ticketId && ticketTitle
    ? `${ticketTitle} (${ticketId})`
    : ticketTitle || ticketId || null;

  const planDisplay = ((meta.planName || meta.plan) as string | null | undefined) ?? null;
  const itemDisplay = ((meta.itemName || meta.item) as string | null | undefined) ?? null;
  const codeDisplay = (meta.code as string | null | undefined) ?? null;

  return {
    serverDisplay,
    ticketDisplay,
    planDisplay,
    itemDisplay,
    codeDisplay,
  };
}

export function resolveStaffPerformedBy(
  log: { actorUsername?: string | null; actorRole?: string | null },
  meta: LogMeta,
  tCommon: (key: string) => string
): string {
  const staffName =
    (log.actorUsername && log.actorUsername !== 'system' ? log.actorUsername : null) ||
    (meta.adminUsername as string) ||
    null;
  const staffRole =
    (log.actorRole && log.actorRole !== 'system' ? log.actorRole : null) ||
    (meta.adminRole as string) ||
    'admin';
  const hasDistinctStaffName = Boolean(
    staffName &&
      staffName.toLowerCase() !== staffRole.toLowerCase() &&
      staffName.toLowerCase() !== 'admin' &&
      staffName.toLowerCase() !== 'system'
  );
  return hasDistinctStaffName && staffName
    ? staffName
    : tCommon(staffRole.toLowerCase() === 'admin' ? 'admin' : staffRole);
}
