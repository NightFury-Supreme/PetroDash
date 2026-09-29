import type { LogMeta, DiffValue } from "./logTypes";

export const META_SYSTEM_KEYS = new Set([
  'changes', 'changed', 'created', 'sessionId', 'adminSessionId', 'ip', 'userAgent', 'adminIp', 'adminUserAgent',
  'method', 'path', 'status', 'statusCode', 'durationMs', 'targetName', 'targetRole',
  'adminId', 'adminUsername', 'adminRole', 'performedByAdmin', 'updatedByAdmin', 'clearedByAdmin', 'deletedByAdmin'
]);

export const CONTEXT_META_KEYS: Array<keyof LogMeta> = [
  'serverName', 'planName', 'subject', 'itemName', 'code',
];

export const CONTEXT_LABELS: Record<string, string> = {
  serverName: 'Server',
  planName:   'Plan',
  subject:    'Ticket',
  itemName:   'Item',
  code:       'Code',
};

export function parseUserAgent(ua?: string | null, unknownLabel: string = 'Unknown'): string {
  if (!ua || typeof ua !== 'string') return unknownLabel;

  const trimmed = ua.trim();
  if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'system') {
    return unknownLabel;
  }

  let browser: string | null = null;
  if (/Edg([ea])?\/|Edge\//i.test(trimmed)) {
    browser = 'Edge';
  } else if (/OPR\/|Opera/i.test(trimmed)) {
    browser = 'Opera';
  } else if (/Vivaldi\//i.test(trimmed)) {
    browser = 'Vivaldi';
  } else if (/Brave\//i.test(trimmed)) {
    browser = 'Brave';
  } else if (/Chrome\/|CriOS\//i.test(trimmed)) {
    browser = 'Chrome';
  } else if (/Firefox\/|FxiOS\//i.test(trimmed)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(trimmed) && !/Chrome\//i.test(trimmed)) {
    browser = 'Safari';
  }

  let os: string | null = null;
  if (/Windows|Win32|Win64|WOW64/i.test(trimmed)) {
    os = 'Windows';
  } else if (/iPhone|iPad|iPod/i.test(trimmed)) {
    os = 'iOS';
  } else if (/Android/i.test(trimmed)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X|Mac_PowerPC/i.test(trimmed)) {
    os = 'macOS';
  } else if (/CrOS/i.test(trimmed)) {
    os = 'ChromeOS';
  } else if (/Linux|X11/i.test(trimmed)) {
    os = 'Linux';
  }

  if (os && browser) {
    return `${os} • ${browser}`;
  }
  if (os) {
    return os;
  }
  if (browser) {
    return browser;
  }

  return unknownLabel;
}

export function formatIpAddress(ip?: string | null, fallback: string = '-'): string {
  if (!ip || typeof ip !== 'string') return fallback;
  const trimmed = ip.trim();
  if (trimmed === '::1' || trimmed === '::ffff:127.0.0.1') return '127.0.0.1';
  if (trimmed.startsWith('::ffff:')) return trimmed.substring(7);
  return trimmed || fallback;
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
