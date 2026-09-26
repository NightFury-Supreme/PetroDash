import type { LogMeta, DiffValue } from "./logTypes";

export const META_SYSTEM_KEYS = new Set([
  'changes', 'changed', 'created', 'sessionId', 'ip', 'userAgent',
  'method', 'path', 'status', 'statusCode', 'durationMs', 'targetName', 'targetRole'
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

export function parseUserAgent(ua?: string, unknownLabel: string = 'Unknown'): string {
  if (!ua) return unknownLabel;

  const browsers: [string, string][] = [
    ['Edge', 'Edge'], ['Firefox', 'Firefox'],
    ['Chrome', 'Chrome'], ['Safari', 'Safari'], ['Opera', 'Opera'],
  ];
  const oses: [string, string][] = [
    ['Windows', 'Windows'], ['Android', 'Android'],
    ['iOS', 'iOS'], ['Mac OS', 'macOS'], ['Linux', 'Linux'],
  ];

  const browser = browsers.find(([token]) => ua.includes(token))?.[1] ?? unknownLabel;
  const os      = oses.find(([token]) => ua.includes(token))?.[1]      ?? unknownLabel;

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
