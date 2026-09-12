import React, { useState } from 'react';
import Link from 'next/link';

interface LogEntry {
  _id: string;
  action: string;
  category?: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  meta?: any;
  metadata?: any;
  actorId?: string;
  actorRole?: string;
  actorUsername?: string;
  resourceId?: string;
  resourceType?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  sessionId?: string;
  targetUserId?: string;
}

interface SharedLogsTableProps {
  logs: LogEntry[];
  loading: boolean;
  variant: 'user' | 'admin';
}

function parseUserAgent(ua?: string) {
  if (!ua) return 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  return `${os} · ${browser}`;
}

function formatActionText(action: string) {
  return action.split('.').map(part =>
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}

function RecursiveDiffViewer({ data, prefix = '' }: { data: any; prefix?: string }) {
  if (!data || typeof data !== 'object') return null;
  return (
    <>
      {Object.entries(data).map(([key, value]: [string, any]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
          return (
            <div key={fullKey} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 sm:w-40 shrink-0 truncate">{fullKey}</span>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono text-[11px] text-red-400/80 bg-red-500/[0.06] px-2 py-0.5 rounded">
                  {String(value.old ?? 'null')}
                </span>
                <span className="text-white/40 text-[10px]">→</span>
                <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-500/[0.06] px-2 py-0.5 rounded">
                  {String(value.new ?? 'null')}
                </span>
              </div>
            </div>
          );
        }

        if (value && typeof value === 'string' && value.includes('->')) {
          const [oldV, newV] = value.split('->').map(s => s.trim());
          return (
            <div key={fullKey} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-sans text-[10px] text-white/55 sm:w-40 shrink-0 truncate">{fullKey}</span>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono text-[11px] text-red-400/80 bg-red-500/[0.06] px-2 py-0.5 rounded">{oldV}</span>
                <span className="text-white/40 text-[10px]">→</span>
                <span className="font-mono text-[11px] text-emerald-400/80 bg-emerald-500/[0.06] px-2 py-0.5 rounded">{newV}</span>
              </div>
            </div>
          );
        }

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return <RecursiveDiffViewer key={fullKey} data={value} prefix={fullKey} />;
        }

        return (
          <div key={fullKey} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
            <span className="font-sans text-[10px] text-white/50 sm:w-40 shrink-0 truncate">{fullKey}</span>
            <span className="font-mono text-[11px] text-white/65 break-all">{typeof value === 'string' ? value : JSON.stringify(value)}</span>
          </div>
        );
      })}
    </>
  );
}

function DiffViewer({ changes }: { changes: any }) {
  if (!changes || typeof changes !== 'object') return null;
  return <RecursiveDiffViewer data={changes} />;
}

function CreatedViewer({ created }: { created: any }) {
  if (!created || typeof created !== 'object') return null;
  return (
    <>
      {Object.entries(created).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
          <span className="font-sans text-[10px] text-white/50 sm:w-40 shrink-0 truncate">{key}</span>
          <span className="font-mono text-[11px] text-emerald-400/70 break-all">{JSON.stringify(value)}</span>
        </div>
      ))}
    </>
  );
}

function InfoRow({ label, value, mono = false, muted = false }: { label: string; value?: string | null; mono?: boolean; muted?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
      <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0 pt-px">{label}</span>
      <span className={`text-right break-all ${mono ? 'font-mono' : ''} text-[11px] ${muted ? 'text-white/50' : 'text-white/70'}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ log }: { log: LogEntry }) {
  if (log.success !== undefined) {
    return log.success
      ? <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-emerald-500" />SUCCESS</span>
      : <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-red-500/20 bg-red-500/[0.06] text-red-400 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-red-500" />FAILED</span>;
  }
  switch (log.severity) {
    case 'CRITICAL': return <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-red-500/20 bg-red-500/[0.06] text-red-400 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />CRITICAL</span>;
    case 'ERROR':    return <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-orange-500/20 bg-orange-500/[0.06] text-orange-400 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-orange-500" />ERROR</span>;
    case 'WARNING':  return <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-yellow-500/20 bg-yellow-500/[0.06] text-yellow-400 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-yellow-500" />WARN</span>;
    default:         return <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded border border-white/[0.07] bg-white/[0.03] text-white/35 text-[9px] font-semibold tracking-wider uppercase"><span className="w-1 h-1 rounded-full bg-white/25" />INFO</span>;
  }
}

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className="w-full font-sans">
      {/* Column Headers */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/40">
        <span>Action</span>
        <span>Device / Browser</span>
        <span>Status</span>
        <span>Date</span>
        <span />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5">
                <div className="h-3 w-36 rounded bg-white/[0.04] animate-pulse" />
                <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse ml-auto" />
              </div>
            ))}
          </>
        ) : logs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/40">
            <span className="text-2xl opacity-50">📋</span>
            <p className="text-xs">No activity logs yet</p>
          </div>
        ) : (
          logs.map((log) => {
            const actualMeta = log.meta || log.metadata || {};
            const hasChanges = actualMeta?.changes && Object.keys(actualMeta.changes).length > 0;
            const hasCreated = actualMeta?.created && Object.keys(actualMeta.created).length > 0;
            const isExpanded = expandedRow === log._id;

            const rawMeta = { ...actualMeta };
            delete rawMeta.changes;
            delete rawMeta.created;
            delete rawMeta.sessionId;
            delete rawMeta.ip;
            delete rawMeta.userAgent;
            delete rawMeta.method;
            delete rawMeta.path;
            delete rawMeta.status;
            delete rawMeta.statusCode;
            delete rawMeta.durationMs;

            return (
              <React.Fragment key={log._id}>
                {/* Row */}
                <div
                  className="group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_44px] gap-4 px-5 py-5 items-center transition hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => toggleRow(log._id)}
                >
                  {/* Action */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">Action</p>
                    <div className="text-sm font-semibold text-white truncate">{formatActionText(log.action)}</div>
                    {variant === 'admin' && (
                      <div className="mt-1 flex items-center gap-1.5">
                        {(() => {
                          const actorId = log.actorId || log.targetUserId || actualMeta?.userId;
                          const actorName = log.actorUsername || actualMeta?.username || actorId;
                          return actorId ? (
                            <Link
                              href={`/admin/users/${actorId}`}
                              className="text-[10px] text-white/50 hover:text-[#ff5722] transition-colors truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {actorName}
                            </Link>
                          ) : <span className="text-[10px] text-white/35">System</span>;
                        })()}
                        <span className="text-[8px] text-white/35 uppercase tracking-wider border border-white/[0.12] rounded px-1 py-px">
                          {log.actorRole || 'system'}
                        </span>
                      </div>
                    )}
                    {variant === 'user' && (() => {
                      const ctx =
                        actualMeta?.serverName
                          ? `Server: ${actualMeta.serverName}`
                          : actualMeta?.planName
                          ? `Plan: ${actualMeta.planName}`
                          : actualMeta?.subject
                          ? `Ticket: ${actualMeta.subject}`
                          : actualMeta?.itemName
                          ? `Item: ${actualMeta.itemName}`
                          : actualMeta?.code
                          ? `Code: ${actualMeta.code}`
                          : log.action;
                      return (
                        <div className="mt-0.5 text-[10px] text-white/45 truncate">{ctx}</div>
                      );
                    })()}
                  </div>

                  {/* Device */}
                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">Device / Browser</p>
                    <div className="text-[11px] text-white/65 font-mono truncate">{(log.ip || actualMeta?.ip) || '—'}</div>
                    <div className="mt-0.5 text-[10px] text-white/40">{parseUserAgent(log.userAgent || actualMeta?.userAgent)}</div>
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
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex md:justify-end">
                    <button
                      className="w-6 h-6 inline-flex items-center justify-center rounded border border-white/[0.12] text-white/40 hover:text-white/70 hover:border-white/[0.2] transition-colors focus:outline-none"
                      onClick={(e) => { e.stopPropagation(); toggleRow(log._id); }}
                    >
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[8px]`} />
                    </button>
                  </div>
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="px-5 pt-3 pb-7 border-b border-white/[0.05] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">

                      {/* Request Info */}
                      <div>
                        <p className="mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40">Request Information</p>
                        <InfoRow label="Request ID" value={log._id} mono muted />
                        <InfoRow label="Session ID" value={log.sessionId || actualMeta?.sessionId} mono muted />
                        <InfoRow label="IP Address" value={(log.ip || actualMeta?.ip) || '—'} mono />
                        {log.category && <InfoRow label="Category" value={log.category} />}
                        {variant === 'admin' && log.resourceType && (
                          <InfoRow label="Resource" value={`${log.resourceType}${log.resourceId ? ` · ${log.resourceId}` : ''}`} mono muted />
                        )}
                        {(log.method || actualMeta?.method) && <InfoRow label="Method" value={log.method || actualMeta?.method} />}
                        {(log.path || actualMeta?.path) && <InfoRow label="Path" value={log.path || actualMeta?.path} mono muted />}
                        {(log.statusCode || actualMeta?.statusCode) && (
                          <div className="flex justify-between items-start gap-4 py-[7px] border-b border-white/[0.04] last:border-0">
                            <span className="text-[9px] uppercase tracking-[0.1em] text-white/45 shrink-0">Status Code</span>
                            <span className={`font-mono text-[11px] ${(log.statusCode || actualMeta?.statusCode || 0) >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {log.statusCode || actualMeta?.statusCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Changes / Created / Meta */}
                      <div className="space-y-5 min-w-0">
                        {hasChanges && (
                          <div>
                            <p className="mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40">Value Changes</p>
                            <DiffViewer changes={actualMeta.changes} />
                          </div>
                        )}

                        {hasCreated && (
                          <div>
                            <p className="mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40">Created</p>
                            <CreatedViewer created={actualMeta.created} />
                          </div>
                        )}

                        {variant === 'admin' && Object.keys(rawMeta).length > 0 && (
                          <div>
                            <p className="mb-3 text-[9px] uppercase tracking-[0.13em] text-white/40">Additional Meta</p>
                            <pre className="text-[10px] text-white/45 font-mono whitespace-pre-wrap break-all overflow-y-auto max-h-36 leading-relaxed">
                              {JSON.stringify(rawMeta, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

