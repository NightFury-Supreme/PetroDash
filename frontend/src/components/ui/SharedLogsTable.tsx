import React, { useState } from 'react';
import Link from 'next/link';

export interface SharedLog {
  _id: string;
  action: string;
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
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  category?: string;
  requestId?: string;
  sessionId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  responsePreview?: string;
}

interface SharedLogsTableProps {
  logs: SharedLog[];
  loading: boolean;
  variant: 'admin' | 'user';
}

const parseUserAgent = (ua?: string) => {
  if (!ua || ua === 'unknown') return 'Unknown Device';
  
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

const formatActionText = (action: string) => {
  const actionMap: Record<string, string> = {
    'auth.login.success': 'Successfully logged in',
    'auth.login.failed': 'Failed login attempt',
    'auth.register.success': 'Registered account',
    'auth.account.delete': 'Deleted account',
    'auth.account.update': 'Updated account profile',
    'auth.session.revoke': 'Revoked session',
    'auth.2fa.enable': 'Enabled Two-Factor Authentication',
    'auth.2fa.disable': 'Disabled Two-Factor Authentication',
    'auth.email.update': 'Updated email address',
    'auth.email.verified': 'Verified email address',
    'auth.password.update': 'Changed password',
    'auth.password.reset.success': 'Reset password',
    'panel.password.reset': 'Reset panel password',
    'server.create': 'Created a new server',
    'server.delete': 'Deleted a server',
    'server.update': 'Updated server settings',
    'earn.claim': 'Claimed AFK coins',
    'earn.session.start': 'Started AFK session',
    'shop.purchase': 'Purchased an item from the shop',
    'shop.purchase.completed': 'Purchased an item from the shop',
    'payment.purchase.completed': 'Added funds / Purchased plan',
    'ticket.create': 'Created a support ticket',
    'ticket.reply': 'Replied to a support ticket',
    'ticket.status_change': 'Updated support ticket status',
    'gift.create': 'Created a gift code',
    'gift.claim': 'Claimed a gift code',
    'referral.code.update': 'Set custom referral code',
    'admin.user.update': 'Profile updated by admin',
    'admin.user.ban': 'Account suspended',
    'admin.user.unban': 'Account suspension lifted',
  };
  return actionMap[action] || action;
};

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getSeverityBadge = (log: SharedLog) => {
    // If we only have success flag (like UserActivity)
    if (log.severity === undefined && log.success !== undefined) {
      if (log.success !== false) {
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
            {[...Array(5)].map((_, i) => (
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
          logs.map((log) => {
            const actualMeta = log.meta || log.metadata || {};
            
            return (
            <React.Fragment key={log._id}>
              <div 
                className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_2.5fr_100px_130px_50px] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
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

                {/* METADATA COLUMN */}
                <div className="min-w-0 flex flex-col justify-center h-full">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Metadata</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Only show resource pill for admin */}
                    {variant === 'admin' && log.resourceType && (
                      <span className="px-2 py-1 rounded-[5px] border border-white/[0.04] bg-white/[0.02] text-white/50 text-[10px]">
                        res: <span className="text-white/70">{log.resourceType} {log.resourceId ? log.resourceId.slice(-8) : ''}</span>
                      </span>
                    )}
                    
                    {/* Show up to 2 metadata fields */}
                    {(() => {
                      const hiddenKeys = ['ip', 'userAgent', 'method', 'path', 'status', 'statusCode', 'durationMs', 'requestId', 'sessionId', 'responsePreview', 'success', 'severity', 'category'];
                      const metaEntries = Object.entries(actualMeta).filter(([k]) => !hiddenKeys.includes(k));
                      
                      const visibleMeta = metaEntries.slice(0, 2);
                      const extraCount = metaEntries.length - 2;

                      if (metaEntries.length === 0 && (!log.resourceType || variant === 'user')) {
                        return <span className="text-xs text-[#555]">-</span>;
                      }

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
                          {log.requestId && (
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-white/40 text-xs">Request ID</span>
                              <span className="text-white/70 font-mono bg-white/[0.02] px-2 py-0.5 rounded text-[10px]">{log.requestId}</span>
                            </div>
                          )}
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
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Additional Meta</h4>
                      <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3">
                        <pre className="text-xs text-white/50 whitespace-pre-wrap break-all overflow-y-auto max-h-48 font-mono">
                          {JSON.stringify(actualMeta, null, 2)}
                        </pre>
                      </div>
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
