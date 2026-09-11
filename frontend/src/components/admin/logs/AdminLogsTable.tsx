import React, { useState } from 'react';
import Link from 'next/link';

interface AuditLog {
  _id: string;
  actorId?: string;
  actorRole: 'user' | 'admin';
  actorUsername?: string;
  action: string;
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category?: 'admin_activity' | 'user_activity' | 'billing_event' | 'data_access' | 'system_event' | 'policy_denied';
  requestId?: string;
  sessionId?: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  meta: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  success?: boolean;
  durationMs?: number;
  responsePreview?: string;
  createdAt: string;
}

interface AdminLogsTableProps {
  logs: AuditLog[];
  loading: boolean;
}

const parseUserAgent = (ua?: string) => {
  if (!ua) return 'Unknown Device';
  
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  let browser = 'Unknown Browser';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  
  return `${os} • ${browser}`;
};

export function AdminLogsTable({ logs, loading }: AdminLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getSeverityBadge = (log: AuditLog) => {
    // Legacy support
    if (log.severity === undefined && log.success !== undefined) {
      if (log.success) {
        return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-green-500/20 bg-green-500/10 text-green-500 text-[10px] font-bold tracking-wider uppercase">Success</span>;
      }
      return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-red-500/20 bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wider uppercase">Failed</span>;
    }

    const sev = log.severity || 'INFO';
    if (sev === 'INFO') {
      return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-green-500/20 bg-green-500/10 text-green-500 text-[10px] font-bold tracking-wider uppercase">Success</span>;
    }
    if (sev === 'WARNING') {
      return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-yellow-500/20 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold tracking-wider uppercase">Warning</span>;
    }
    if (sev === 'ERROR' || sev === 'CRITICAL') {
      return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-red-500/20 bg-red-500/10 text-red-500 text-[10px] font-bold tracking-wider uppercase">Failed</span>;
    }
    
    return <span className="inline-flex px-2 py-0.5 rounded-[4px] border border-white/20 bg-white/10 text-white text-[10px] font-bold tracking-wider uppercase">{sev}</span>;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (logs.length === 0 && !loading) {
    return (
      <div className="border border-[#222] bg-[#111] rounded-xl p-8 text-center mt-6">
        <div className="text-white font-semibold">No logs found</div>
        <div className="text-[#AAAAAA] text-sm mt-1">Try adjusting your filters or check back later.</div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6">
      {/* TABLE HEADER */}
      <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_2.5fr_100px_130px_50px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase tracking-widest bg-[#1A1A1A]">
        <span>Action</span>
        <span>Device / Browser</span>
        <span>Metadata</span>
        <span>Status</span>
        <span>Date</span>
        <span></span>
      </div>

      {/* TABLE LIST */}
      <div className="divide-y divide-white/[0.06]">
        {loading && logs.length === 0 ? (
          <>
            {[...Array(10)].map((_, i) => (
              <div key={`sk-${i}`} className="grid grid-cols-[1.5fr_1.5fr_2.5fr_100px_130px_50px] gap-4 px-5 py-5 items-center">
                <div><div className="h-4 w-32 rounded bg-white/[0.04] animate-pulse" /></div>
                <div>
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
                    <div className="h-2 w-32 rounded bg-white/[0.04] animate-pulse" />
                  </div>
                </div>
                <div><div className="h-5 w-48 rounded bg-white/[0.04] animate-pulse" /></div>
                <div><div className="h-5 w-16 rounded bg-white/[0.04] animate-pulse" /></div>
                <div><div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" /></div>
                <div></div>
              </div>
            ))}
          </>
        ) : (
          logs.map((log) => (
            <React.Fragment key={log._id}>
              <div 
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_2.5fr_100px_130px_50px] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
              >
                {/* ACTION COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Action</p>
                  <div className="text-[13px] font-medium text-white/90 truncate">{log.action}</div>
                  <div className="text-[10px] text-white/40 mt-1 flex items-center gap-1.5 truncate">
                    {(() => {
                      const displayActorId = log.actorId || log.targetUserId || (log.meta as any)?.userId;
                      const displayActorName = log.actorUsername || (log.meta as any)?.username || displayActorId;
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
                      {log.actorRole}
                    </span>
                  </div>
                </div>

                {/* DEVICE / BROWSER COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Device / Browser</p>
                  <div className="text-[11px] text-white/60 font-mono">{(log.ip || (log.meta as any)?.ip) || '-'}</div>
                  <div className="text-[10px] text-white/30 mt-1">{parseUserAgent(log.userAgent || (log.meta as any)?.userAgent)}</div>
                </div>

                {/* METADATA COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Metadata</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Always show resource as a pill */}
                    <span className="px-2 py-1 rounded-[5px] border border-white/[0.04] bg-white/[0.02] text-white/50 text-[10px]">
                      res: <span className="text-white/70">{log.resourceType} {log.resourceId ? log.resourceId.slice(-8) : ''}</span>
                    </span>
                    
                    {/* Show up to 2 metadata fields */}
                    {(() => {
                      const hiddenKeys = ['ip', 'userAgent', 'method', 'path', 'status', 'statusCode', 'durationMs', 'requestId', 'sessionId', 'responsePreview', 'success', 'severity', 'category'];
                      const metaEntries = Object.entries(log.meta || {}).filter(([k]) => !hiddenKeys.includes(k));
                      
                      const visibleMeta = metaEntries.slice(0, 2);
                      const extraCount = metaEntries.length - 2;

                      return (
                        <>
                          {visibleMeta.map(([k, v]) => (
                            <span key={k} className="px-2 py-1 rounded-[5px] border border-white/[0.04] bg-white/[0.02] text-white/50 text-[10px] truncate max-w-[150px]">
                              {k}: <span className="text-white/70">{typeof v === 'string' || typeof v === 'number' ? v : JSON.stringify(v)}</span>
                            </span>
                          ))}
                          {extraCount > 0 && (
                            <span className="px-2 py-1 rounded-[5px] border border-white/[0.04] bg-white/[0.05] text-white/70 text-[10px] font-medium">
                              +{extraCount}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
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
                <div className="px-5 py-6 bg-[#111111] border-t border-white/[0.06]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Request Information</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Request ID</span>
                            <span className="text-white/70 font-mono bg-white/[0.02] px-2 py-0.5 rounded text-[10px]">{log.requestId || (log.meta as any)?.requestId || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Category</span>
                            <span className="text-white/70 text-xs uppercase tracking-wider">{log.category || (log.meta as any)?.category || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Session ID</span>
                            <span className="text-white/70 font-mono text-[10px]">{log.sessionId || (log.meta as any)?.sessionId || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Resource</span>
                            <span className="text-white/70 font-mono text-xs">{log.resourceType} {log.resourceId}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">IP Address</span>
                            <span className="text-white/70 font-mono bg-white/[0.02] px-2 py-0.5 rounded text-xs">{(log.ip || (log.meta as any)?.ip) || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Method</span>
                            <span className="text-white/70 text-xs">{(log.method || (log.meta as any)?.method) || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Path</span>
                            <span className="text-white/70 font-mono text-xs truncate max-w-[250px]">{(log.path || (log.meta as any)?.path) || '-'}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                            <span className="text-white/40 text-xs">Status Code</span>
                            <span className={`font-medium text-xs ${(log.statusCode || (log.meta as any)?.status || (log.meta as any)?.statusCode) && (log.statusCode || (log.meta as any)?.status || (log.meta as any)?.statusCode) >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                              {(log.statusCode || (log.meta as any)?.status || (log.meta as any)?.statusCode) || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/40 text-xs">Duration</span>
                            <span className="text-white/70 text-xs">{formatDuration(log.durationMs || (log.meta as any)?.durationMs)}</span>
                          </div>
                      </div>
                    </div>

                    {/* Meta Data */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Additional Meta</h4>
                      <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3">
                        <pre className="text-xs text-white/50 whitespace-pre-wrap break-all overflow-y-auto max-h-48 font-mono">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
