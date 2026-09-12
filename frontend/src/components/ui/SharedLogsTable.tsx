import React, { useState } from 'react';
import Link from 'next/link';
import { getFieldLabel } from '@/config/field-labels';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type Variant  = 'user' | 'admin';

interface LogMeta {
  changes?:    Record<string, unknown>;
  created?:    Record<string, unknown>;
  sessionId?:  string;
  ip?:         string;
  userAgent?:  string;
  method?:     string;
  path?:       string;
  status?:     string;
  statusCode?: number;
  durationMs?: number;
  userId?:     string;
  username?:   string;
  serverName?: string;
  planName?:   string;
  subject?:    string;
  itemName?:   string;
  code?:       string;
  [key: string]: unknown;
}

interface LogEntry {
  _id:          string;
  action:       string;
  category?:    string;
  createdAt:    string;
  ip?:          string;
  userAgent?:   string;
  success?:     boolean;
  severity?:    Severity;
  meta?:        LogMeta;
  metadata?:    LogMeta;
  actorId?:     string;
  actorRole?:   string;
  actorUsername?: string;
  resourceId?:  string;
  resourceType?: string;
  method?:      string;
  path?:        string;
  statusCode?:  number;
  durationMs?:  number;
  sessionId?:   string;
  targetUserId?: string;
}

interface SharedLogsTableProps {
  logs:    LogEntry[];
  loading: boolean;
  variant: Variant;
}

interface DiffValue {
  old: unknown;
  new: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Keys stripped from the raw meta block before showing "Additional Meta". */
const META_SYSTEM_KEYS = new Set([
  'changes', 'changed', 'created', 'sessionId', 'ip', 'userAgent',
  'method', 'path', 'status', 'statusCode', 'durationMs',
]);

/** Context hint priority order for the user-facing action subtitle. */
const CONTEXT_META_KEYS: Array<keyof LogMeta> = [
  'serverName', 'planName', 'subject', 'itemName', 'code',
];

const CONTEXT_LABELS: Record<string, string> = {
  serverName: 'Server',
  planName:   'Plan',
  subject:    'Ticket',
  itemName:   'Item',
  code:       'Code',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatActionText(action: string): string {
  return action
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseUserAgent(ua?: string): string {
  if (!ua) return 'Unknown';

  const browsers: [string, string][] = [
    ['Edge', 'Edge'], ['Firefox', 'Firefox'],
    ['Chrome', 'Chrome'], ['Safari', 'Safari'],
  ];
  const oses: [string, string][] = [
    ['Windows', 'Windows'], ['Android', 'Android'],
    ['iOS', 'iOS'], ['Mac OS', 'macOS'], ['Linux', 'Linux'],
  ];

  const browser = browsers.find(([token]) => ua.includes(token))?.[1] ?? 'Unknown';
  const os      = oses.find(([token]) => ua.includes(token))?.[1]      ?? 'Unknown';

  return `${os} · ${browser}`;
}

function isMongoId(str: string): boolean {
  return /^[a-f0-9]{24}$/i.test(str);
}

function isDiffValue(value: unknown): value is DiffValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('old' in value || 'new' in value)
  );
}

function isLegacyDiffString(value: unknown): value is string {
  return typeof value === 'string' && value.includes('->');
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitive UI atoms
// ─────────────────────────────────────────────────────────────────────────────

/** Red pill → Green pill for a single diff pair. */
function DiffPills({ oldVal, newVal }: { oldVal: string; newVal: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end ml-auto shrink-0">
      <span className="font-mono text-[11px] text-red-400/80 bg-red-500/[0.06] px-2 py-0.5 rounded">
        {oldVal}
      </span>
      <span className="text-white/40 text-[10px]">→</span>
      <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-500/[0.06] px-2 py-0.5 rounded">
        {newVal}
      </span>
    </div>
  );
}

/** A flat label / value row used in the expanded panel. */
function InfoRow({
  label,
  value,
  mono  = false,
  muted = false,
}: {
  label: string;
  value?: string | number | null;
  mono?:  boolean;
  muted?: boolean;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] uppercase tracking-[0.1em] text-white shrink-0 pt-px">
        {label}
      </span>
      <span
        className={[
          'text-right break-all text-[11px]',
          mono  ? 'font-mono' : '',
          muted ? 'text-white/50' : 'text-white',
        ].join(' ')}
      >
        {String(value)}
      </span>
    </div>
  );
}

/** Section heading used in the expanded panel. */
function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-3 text-[10px] uppercase tracking-[0.13em] text-white/60 font-semibold ${className}`}>
      {children}
    </p>
  );
}

/** Status / severity badge. */
function StatusBadge({ log }: { log: LogEntry }) {
  type BadgeSpec = { dot: string; text: string; border: string; bg: string; pulse?: boolean };

  const badge = (spec: BadgeSpec, label: string) => (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] rounded border
        ${spec.border} ${spec.bg} ${spec.text}
        text-[9px] font-semibold tracking-wider uppercase`}
    >
      <span className={`w-1 h-1 rounded-full ${spec.dot}${spec.pulse ? ' animate-pulse' : ''}`} />
      {label}
    </span>
  );

  if (log.success !== undefined) {
    return log.success
      ? badge({ dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.06]' }, 'SUCCESS')
      : badge({ dot: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/[0.06]'     }, 'FAILED');
  }

  switch (log.severity) {
    case 'CRITICAL':
      return badge({ dot: 'bg-red-500',    text: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/[0.06]',    pulse: true }, 'CRITICAL');
    case 'ERROR':
      return badge({ dot: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/[0.06]' }, 'ERROR');
    case 'WARNING':
      return badge({ dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/20', bg: 'bg-yellow-500/[0.06]' }, 'WARN');
    default:
      return badge({ dot: 'bg-white/25',   text: 'text-white/35',   border: 'border-white/[0.07]',  bg: 'bg-white/[0.03]'     }, 'INFO');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff renderers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a nested diff object recursively.
 * Handles: { old, new } objects, "A -> B" legacy strings, plain nested objects.
 */
function DiffViewer({ data, prefix = '' }: { data: Record<string, unknown>; prefix?: string }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const fullKey    = prefix ? `${prefix}.${key}` : key;
        const displayKey = getFieldLabel(fullKey);

        if (isDiffValue(value)) {
          return (
            <div key={fullKey} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[11px] text-white shrink-0 truncate">{displayKey}</span>
              <DiffPills oldVal={String(value.old ?? '—')} newVal={String(value.new ?? '—')} />
            </div>
          );
        }

        if (isLegacyDiffString(value)) {
          const separatorIndex = value.indexOf('->');
          const oldVal = value.slice(0, separatorIndex).trim();
          const newVal = value.slice(separatorIndex + 2).trim();
          return (
            <div key={fullKey} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[11px] text-white shrink-0 truncate">{displayKey}</span>
              <DiffPills oldVal={oldVal} newVal={newVal} />
            </div>
          );
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <DiffViewer
              key={fullKey}
              data={value as Record<string, unknown>}
              prefix={fullKey}
            />
          );
        }

        return (
          <div key={fullKey} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
            <span className="font-sans text-[11px] text-white shrink-0 truncate">{displayKey}</span>
            <span className="font-mono text-[11px] text-white/90 break-all ml-auto text-right">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </span>
          </div>
        );
      })}
    </>
  );
}

/**
 * Renders the "created" block — shows each created field in emerald.
 */
function CreatedViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
          <span className="font-sans text-[11px] text-white shrink-0 truncate">
            {getFieldLabel(key)}
          </span>
          <span className="font-mono text-[11px] text-emerald-400/90 break-all ml-auto text-right">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </span>
        </div>
      ))}
    </>
  );
}

/**
 * Renders the "additional meta" block — arbitrary key/value pairs.
 * Handles nested objects, booleans, arrays, diff strings, and IDs intelligently.
 */
function MetaViewer({ data }: { data: Record<string, unknown> }) {
  return (
    <>
      {Object.entries(data).map(([key, value]) => {
        const label = getFieldLabel(key);

        // { old, new } inline diff
        if (isDiffValue(value)) {
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[11px] text-white shrink-0 truncate">{label}</span>
              <DiffPills oldVal={String((value as DiffValue).old ?? '—')} newVal={String((value as DiffValue).new ?? '—')} />
            </div>
          );
        }

        // Nested object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return (
            <div key={key} className="mt-4 first:mt-0">
              <SectionHeading>{label}</SectionHeading>
              <div className="pl-2 border-l border-white/[0.06]">
                <MetaViewer data={value as Record<string, unknown>} />
              </div>
            </div>
          );
        }

        // Array
        if (Array.isArray(value)) {
          return (
            <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[10px] uppercase tracking-[0.1em] text-white shrink-0 pt-px">{label}</span>
              <span className="text-right text-[11px] text-white/90 break-all">
                {(value as unknown[]).join(', ') || '—'}
              </span>
            </div>
          );
        }

        // Boolean
        if (typeof value === 'boolean') {
          return (
            <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[10px] uppercase tracking-[0.1em] text-white shrink-0 pt-px">{label}</span>
              <span className={`text-[11px] font-medium ${value ? 'text-emerald-400' : 'text-red-400'}`}>
                {value ? 'Yes' : 'No'}
              </span>
            </div>
          );
        }

        if (value === null || value === undefined) return null;

        const str = String(value);

        // "A -> B" legacy diff string
        if (isLegacyDiffString(str)) {
          const idx    = str.indexOf('->');
          const oldVal = str.slice(0, idx).trim();
          const newVal = str.slice(idx + 2).trim();
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[11px] text-white shrink-0 truncate">{label}</span>
              <DiffPills oldVal={oldVal} newVal={newVal} />
            </div>
          );
        }

        const isMono = isMongoId(str);

        return (
          <div key={key} className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
            <span className="text-[10px] uppercase tracking-[0.1em] text-white shrink-0 pt-px">{label}</span>
            <span className={`text-right break-all text-[11px] ${isMono ? 'font-mono text-white/50' : 'text-white'}`}>
              {str}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ActionCell({ log, variant, meta }: { log: LogEntry; variant: Variant; meta: LogMeta }) {
  // Admin: show actor link + role badge
  if (variant === 'admin') {
    const actorId   = log.actorId ?? log.targetUserId ?? meta.userId;
    const actorName = log.actorUsername ?? meta.username ?? actorId;

    return (
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white truncate">
          {formatActionText(log.action)}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {actorId ? (
            <Link
              href={`/admin/users/${actorId}`}
              className="text-[10px] text-white/50 hover:text-[#ff5722] transition-colors truncate"
              onClick={e => e.stopPropagation()}
            >
              {actorName as string}
            </Link>
          ) : (
            <span className="text-[10px] text-white/35">System</span>
          )}
          <span className="text-[8px] text-white/35 uppercase tracking-wider border border-white/[0.12] rounded px-1 py-px">
            {log.actorRole ?? 'system'}
          </span>
        </div>
      </div>
    );
  }

  // User: show action name + context hint from metadata
  const ctxKey = CONTEXT_META_KEYS.find(k => meta[k]);
  const ctx    = ctxKey
    ? `${CONTEXT_LABELS[ctxKey]}: ${meta[ctxKey]}`
    : log.action;

  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold text-white truncate">
        {formatActionText(log.action)}
      </div>
      <div className="mt-0.5 text-[10px] text-white/45 truncate">{ctx as string}</div>
    </div>
  );
}

function ExpandedPanel({ log, variant, meta }: { log: LogEntry; variant: Variant; meta: LogMeta }) {
  const hasChanges = meta.changes != null && Object.keys(meta.changes).length > 0;
  const hasChangedLegacy = meta.changed != null && Object.keys(meta.changed).length > 0;
  const hasCreated = meta.created != null && Object.keys(meta.created).length > 0;

  const rawMeta = Object.fromEntries(
    Object.entries(meta).filter(([k]) => !META_SYSTEM_KEYS.has(k))
  );
  const hasRawMeta = Object.keys(rawMeta).length > 0;

  const ip         = log.ip ?? meta.ip;
  const statusCode = log.statusCode ?? meta.statusCode;

  return (
    <div className="px-5 pt-3 pb-7 border-b border-white/[0.05] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">

        {/* ── Request Information ─────────────────── */}
        <div>
          <SectionHeading>Request Information</SectionHeading>
          <InfoRow label="Request ID" value={log._id}                                  mono muted />
          <InfoRow label="Session ID" value={log.sessionId ?? meta.sessionId}          mono muted />
          <InfoRow label="IP Address" value={ip ?? '—'}                                mono />
          {log.category    && <InfoRow label="Category" value={log.category} />}
          {log.method      && <InfoRow label="Method"   value={log.method}   />}
          {log.path        && <InfoRow label="Path"     value={log.path}     mono muted />}
          {variant === 'admin' && log.resourceType && (
            <InfoRow
              label="Resource"
              value={`${log.resourceType}${log.resourceId ? ` · ${log.resourceId}` : ''}`}
              mono
              muted
            />
          )}
          {statusCode != null && (
            <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
              <span className="text-[10px] uppercase tracking-[0.1em] text-white shrink-0 pt-px">Status Code</span>
              <span className={`font-mono text-[11px] ${statusCode >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                {statusCode}
              </span>
            </div>
          )}
        </div>

        {/* ── Changes / Created / Meta ────────────── */}
        <div className="space-y-5 min-w-0">
          {hasChanges && (
            <div>
              <SectionHeading>Value Changes</SectionHeading>
              <DiffViewer data={meta.changes as Record<string, unknown>} />
            </div>
          )}
          {hasChangedLegacy && (
            <div>
              <SectionHeading>Changed</SectionHeading>
              <DiffViewer data={meta.changed as Record<string, unknown>} />
            </div>
          )}
          {hasCreated && (
            <div>
              <SectionHeading>Created</SectionHeading>
              <CreatedViewer data={meta.created as Record<string, unknown>} />
            </div>
          )}
          {variant === 'admin' && hasRawMeta && (
            <div>
              <SectionHeading>Additional Info</SectionHeading>
              <MetaViewer data={rawMeta} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="w-full font-sans">

      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/40">
        <span>Action</span>
        <span>Device / Browser</span>
        <span>Status</span>
        <span>Date</span>
        <span />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {loading && (
          <>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5">
                <div className="h-3 w-36 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse ml-auto" />
              </div>
            ))}
          </>
        )}

        {!loading && logs.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/40">
            <span className="text-2xl opacity-50">📋</span>
            <p className="text-xs">No activity yet</p>
          </div>
        )}

        {!loading && logs.map(log => {
          const meta       = log.meta ?? log.metadata ?? {};
          const isExpanded = expandedId === log._id;
          const ip         = log.ip ?? meta.ip;

          return (
            <React.Fragment key={log._id}>
              {/* Row */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className="group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_44px] gap-4 px-5 py-5 items-center transition hover:bg-white/[0.02] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                onClick={() => toggle(log._id)}
                onKeyDown={e => e.key === 'Enter' && toggle(log._id)}
              >
                {/* Action */}
                <ActionCell log={log} variant={variant} meta={meta} />

                {/* Device / IP */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">Device</p>
                  <div className="text-[11px] text-white/65 font-mono truncate">{ip ?? '—'}</div>
                  <div className="mt-0.5 text-[10px] text-white/40">
                    {parseUserAgent(log.userAgent ?? meta.userAgent)}
                  </div>
                </div>

                {/* Status */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">Status</p>
                  <StatusBadge log={log} />
                </div>

                {/* Date */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">Date</p>
                  <div className="text-[11px] text-white/55">
                    {new Date(log.createdAt).toLocaleString('en-GB', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </div>
                </div>

                {/* Expand toggle */}
                <div className="flex md:justify-end">
                  <button
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    className="w-6 h-6 inline-flex items-center justify-center rounded border border-white/[0.12] text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-colors focus:outline-none"
                    onClick={e => { e.stopPropagation(); toggle(log._id); }}
                  >
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px]`} />
                  </button>
                </div>
              </div>

              {/* Expanded detail panel */}
              {isExpanded && (
                <ExpandedPanel log={log} variant={variant} meta={meta} />
              )}
            </React.Fragment>
          );
        })}
      </div>

    </div>
  );
}
