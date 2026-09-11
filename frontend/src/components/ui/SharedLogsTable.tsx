import React, { useState } from 'react';
import Link from 'next/link';

interface LogEntry {
  _id: string;
  action: string;
  category?: string;
  createdAt: string;
  
  // Generic fields
  ip?: string;
  userAgent?: string;
  success?: boolean;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  meta?: any;
  metadata?: any;
  
  // Admin fields
  actorId?: string;
  actorRole?: string;
  actorUsername?: string;
  resourceId?: string;
  resourceType?: string;
  
  // Network/Auth fields
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
  if (!ua) return 'Unknown Device';
  
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return `${os} • ${browser}`;
}

function formatDuration(ms?: number) {
  if (ms === undefined || ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatActionText(action: string) {
  return action.split('.').map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}

function DiffViewer({ changes }: { changes: any }) {
  if (!changes || typeof changes !== 'object') return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {Object.entries(changes).map(([key, value]: [string, any]) => {
        if (!value || typeof value !== 'object' || (!('old' in value) && !('new' in value))) {
          return (
            <div key={key} className="flex items-start gap-4 p-2 bg-white/[0.02] rounded border border-white/[0.05]">
              <span className="text-white/40 font-mono text-[10px] w-24 shrink-0 truncate">{key}</span>
              <span className="text-white/70 font-mono text-xs">{JSON.stringify(value)}</span>
            </div>
          );
        }
        
        return (
          <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-[#0F0F0F] rounded border border-[#222]">
            <span className="text-white/50 font-mono text-[10px] sm:w-32 shrink-0 truncate">{key}</span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full min-w-0">
              <span className="bg-red-500/10 text-red-400 font-mono text-[10px] px-1.5 py-0.5 rounded break-all">
                {JSON.stringify(value.old) ?? 'null'}
              </span>
              <span className="text-white/20 hidden sm:inline">→</span>
              <span className="bg-green-500/10 text-green-400 font-mono text-[10px] px-1.5 py-0.5 rounded break-all">
                {JSON.stringify(value.new) ?? 'null'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreatedViewer({ created }: { created: any }) {
  if (!created || typeof created !== 'object') return null;
  return (
    <div className="flex flex-col gap-2 mt-2">
      {Object.entries(created).map(([key, value]) => (
        <div key={key} className="flex items-start gap-4 p-2 bg-[#0F0F0F] rounded border border-[#222]">
          <span className="text-white/50 font-mono text-[10px] w-32 shrink-0 truncate">{key}</span>
          <span className="text-green-400 font-mono text-[10px] break-all">{JSON.stringify(value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getSeverityBadge = (log: LogEntry) => {
    if (log.success !== undefined) {
      if (log.success) {
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-medium border border-green-500/20"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>SUCCESS</span>;
      } else {
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>FAILED</span>;
      }
    }

    switch (log.severity) {
      case 'CRITICAL':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>CRITICAL</span>;
      case 'ERROR':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[10px] font-medium border border-orange-500/20"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>ERROR</span>;
      case 'WARNING':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-medium border border-yellow-500/20"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>WARN</span>;
      case 'INFO':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>INFO</span>;
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="w-full">
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_100px_130px_50px] gap-4 px-5 py-3 border-b border-[#222] bg-[#121212]/50 text-[10px] font-semibold text-[#888] uppercase tracking-wider rounded-t-lg">
        <div>Action</div>
        <div>Device / Browser</div>
        <div>Status</div>
        <div>Date</div>
        <div className="text-right">More</div>
      </div>
      
      <div className="divide-y divide-[#1A1A1A]">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center h-[72px] px-5 bg-white/[0.02]">
                <div className="h-4 bg-white/5 rounded w-1/4"></div>
              </div>
            ))}
          </>
        ) : logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-[#666]">
            <i className="fas fa-inbox text-3xl mb-3 opacity-20"></i>
            <p className="text-sm">No logs found</p>
          </div>
        ) : (
          logs.map((log) => {
            const actualMeta = log.meta || log.metadata || {};
            const hasChanges = actualMeta?.changes && Object.keys(actualMeta.changes).length > 0;
            const hasCreated = actualMeta?.created && Object.keys(actualMeta.created).length > 0;
            
            // For the JSON fallback, exclude 'changes' and 'created' from raw display
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
              <div 
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_100px_130px_50px] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => toggleRow(log._id)}
              >
                {/* ACTION COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Action</p>
                  <div className="text-[13px] font-medium text-white/90 truncate">{formatActionText(log.action)}</div>
                  {variant === 'admin' && (
                    <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1.5 truncate">
                      {(() => {
                        const displayActorId = log.actorId || log.targetUserId || actualMeta?.userId;
                        const displayActorName = log.actorUsername || actualMeta?.username || displayActorId;
                        return displayActorId ? (
                          <Link 
                            href={`/admin/users/${displayActorId}`}
                            className="hover:text-[#ff5722] hover:underline transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {displayActorName}
                          </Link>
                        ) : (
                          <span>System</span>
                        );
                      })()}
                      <span className="px-1 py-[1px] bg-white/5 border border-white/10 rounded uppercase text-[8px] tracking-wider text-white/30">
                        {log.actorRole || 'System'}
                      </span>
                    </div>
                  )}
                  {variant === 'user' && (
                     <div className="text-[10px] text-white/30 mt-1 truncate">{log.action}</div>
                  )}
                </div>

                {/* DEVICE / BROWSER COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Device / Browser</p>
                  <div className="text-[11px] text-white/60 font-mono">{(log.ip || actualMeta?.ip) || '-'}</div>
                  <div className="text-[10px] text-white/30 mt-1">{parseUserAgent(log.userAgent || actualMeta?.userAgent)}</div>
                </div>

                {/* STATUS COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Status</p>
                  <div>{getSeverityBadge(log)}</div>
                </div>

                {/* DATE COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Date</p>
                  <div className="text-[11px] text-white/40">
                    {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                {/* DETAILS DROPDOWN TOGGLE */}
                <div className="min-w-0 flex flex-col justify-center h-full md:items-end">
                  <button className="w-7 h-7 inline-flex items-center justify-center rounded border border-[#282828] bg-[#121212] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors focus:outline-none">
                    <i className={`fas fa-chevron-${expandedRow === log._id ? 'up' : 'down'} text-xs`}></i>
                  </button>
                </div>
              </div>
              
              {/* Expanded Row Details */}
              {expandedRow === log._id && (
                <div className="px-5 py-4 bg-[#111] border-y border-[#222]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Request Information */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Request Information</h4>
                      <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Request ID</span>
                            <span className="text-white/70 font-mono text-[10px]">{log._id}</span>
                          </div>
                          {log.category && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Category</span>
                              <span className="text-white/70 text-xs uppercase tracking-wider">{log.category}</span>
                            </div>
                          )}
                          {(log.sessionId || actualMeta?.sessionId) && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Session ID</span>
                              <span className="text-white/70 font-mono text-[10px]">{log.sessionId || actualMeta?.sessionId}</span>
                            </div>
                          )}
                          {variant === 'admin' && log.resourceType && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Resource</span>
                              <span className="text-white/70 font-mono text-xs">{log.resourceType} {log.resourceId}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">IP Address</span>
                            <span className="text-white/70 font-mono bg-white/[0.02] px-2 py-0.5 rounded text-xs">{(log.ip || actualMeta?.ip) || '-'}</span>
                          </div>
                          {(log.method || actualMeta?.method) && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Method</span>
                              <span className="text-white/70 text-xs">{log.method || actualMeta?.method}</span>
                            </div>
                          )}
                          {(log.path || actualMeta?.path) && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Path</span>
                              <span className="text-white/70 font-mono text-xs truncate max-w-[250px]">{log.path || actualMeta?.path}</span>
                            </div>
                          )}
                          {(log.statusCode || actualMeta?.status || actualMeta?.statusCode) && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Status Code</span>
                              <span className={`font-medium text-xs ${(log.statusCode || actualMeta?.status || actualMeta?.statusCode) >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                                {log.statusCode || actualMeta?.status || actualMeta?.statusCode}
                              </span>
                            </div>
                          )}
                          {(log.durationMs || actualMeta?.durationMs) && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Duration</span>
                              <span className="text-white/70 text-xs">{formatDuration(log.durationMs || actualMeta?.durationMs)}</span>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Meta Data */}
                    <div className="space-y-4">
                      {hasChanges && (
                        <div className="mb-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">Value Changes</h4>
                          <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3">
                            <DiffViewer changes={actualMeta.changes} />
                          </div>
                        </div>
                      )}

                      {hasCreated && (
                        <div className="mb-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">Created Data</h4>
                          <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3">
                            <CreatedViewer created={actualMeta.created} />
                          </div>
                        </div>
                      )}

                      {Object.keys(rawMeta).length > 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">Additional Meta</h4>
                          <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3">
                            <pre className="text-xs text-white/50 whitespace-pre-wrap break-all overflow-y-auto max-h-48 font-mono">
                              {JSON.stringify(rawMeta, null, 2)}
                            </pre>
                          </div>
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
