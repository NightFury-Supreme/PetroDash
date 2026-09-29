import type { LogMeta, DiffValue } from "./logTypes";

export const META_SYSTEM_KEYS = new Set([
  'changes', 'changed', 'created', 'sessionId', 'adminSessionId', 'ip', 'userAgent', 'adminIp', 'adminUserAgent',
  'method', 'path', 'status', 'statusCode', 'durationMs', 'targetName', 'targetRole',
  'adminId', 'adminUsername', 'adminRole', 'performedByAdmin', 'updatedByAdmin', 'clearedByAdmin', 'deletedByAdmin',
  'targetUserId', 'userId', 'body', 'responsePreview', 'requestId', 'success',
  'targetUsername', 'targetEmail', 'banUntil', 'durationMinutes', 'permanent', 'reason',
  'name', 'serverName', 'planName', 'plan', 'subject', 'ticketTitle', 'itemName', 'code',
]);

export const CONTEXT_META_KEYS: Array<keyof LogMeta> = [
  'serverName', 'name', 'planName', 'plan', 'subject', 'ticketTitle', 'itemName', 'code', 'reason',
];

export const CONTEXT_LABELS: Record<string, string> = {
  serverName: 'Server',
  name: 'Server',
  planName: 'Plan',
  plan: 'Plan',
  subject: 'Ticket',
  ticketTitle: 'Ticket',
  itemName: 'Item',
  code: 'Code',
  reason: 'Reason',
};

export function parseUserAgent(ua?: string, unknownLabel: string = 'Unknown'): string {
  if (!ua || typeof ua !== 'string') return unknownLabel;
  const trimmed = ua.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed === '-') return unknownLabel;

  const browsers: [string, string][] = [
    ['Edg', 'Edge'], ['Edge', 'Edge'], ['Firefox', 'Firefox'],
    ['Chrome', 'Chrome'], ['Safari', 'Safari'], ['Opera', 'Opera'],
    ['OPR', 'Opera'], ['Brave', 'Brave'], ['Vivaldi', 'Vivaldi'],
  ];
  const oses: [string, string][] = [
    ['Windows', 'Windows'], ['Android', 'Android'],
    ['iPhone', 'iOS'], ['iPad', 'iOS'], ['iOS', 'iOS'],
    ['Macintosh', 'macOS'], ['Mac OS', 'macOS'],
    ['Linux', 'Linux'], ['CrOS', 'ChromeOS'],
  ];

  const browser = browsers.find(([token]) => trimmed.includes(token))?.[1];
  const os      = oses.find(([token]) => trimmed.includes(token))?.[1];

  if (!os && !browser) return unknownLabel;
  if (!os) return browser!;
  if (!browser) return os;

  return `${os} • ${browser}`;
}

export function isMongoId(str: string): boolean {
  return /^[a-f0-9]{24}$/i.test(str);
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
