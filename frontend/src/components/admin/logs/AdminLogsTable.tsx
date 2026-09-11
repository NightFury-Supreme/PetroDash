import React, { useState } from 'react';
import Link from 'next/link';

interface AuditLog {
  _id: string;
  actorId?: string;
  actorRole: 'user' | 'admin';
  actorUsername?: string;
  action: string;
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

export function AdminLogsTable({ logs, loading }: AdminLogsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return 'fa-plus-circle text-green-400';
    if (action.includes('update')) return 'fa-edit text-blue-400';
    if (action.includes('delete')) return 'fa-trash text-red-400';
    if (action.includes('login')) return 'fa-sign-in-alt text-green-400';
    if (action.includes('logout')) return 'fa-sign-out-alt text-yellow-400';
    if (action.includes('purchase')) return 'fa-shopping-cart text-purple-400';
    return 'fa-cog text-gray-400';
  };

  const getRoleBadge = (role: string) => {
    const config = {
      'admin': { color: 'bg-[#FF5722]/10 text-[#FF5722] border-[#FF5722]/20', icon: 'fa-shield-alt' },
      'user': { color: 'bg-white/5 text-[#aaa] border-white/10', icon: 'fa-user' }
    };

    const roleConfig = config[role as keyof typeof config] || config.user;

    return (
      <span className={`inline-flex items-center gap-[5px] px-2 py-0.5 rounded-[5px] text-[10px] font-medium border ${roleConfig.color} uppercase tracking-wider`}>
        <i className={`fas ${roleConfig.icon} text-[9px]`}></i>
        {role}
      </span>
    );
  };

  const getSuccessBadge = (success?: boolean) => {
    if (typeof success !== 'boolean') return null;

    const config = success 
      ? { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: 'fa-check' }
      : { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: 'fa-times' };

    return (
      <span className={`inline-flex items-center gap-[5px] px-2 py-0.5 rounded-[5px] text-[10px] font-medium border ${config.color} uppercase tracking-wider`}>
        <i className={`fas ${config.icon} text-[9px]`}></i>
        {success ? 'Success' : 'Failed'}
      </span>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
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
      <div className="hidden gap-4 grid-cols-[1fr_1.2fr_1.5fr_1fr_100px_70px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>Time</span>
        <span>Actor</span>
        <span>Action</span>
        <span>Resource</span>
        <span>Status</span>
        <span className="text-right">Details</span>
      </div>

      {/* TABLE LIST */}
      <div className="divide-y divide-white/[0.06]">
        {loading && logs.length === 0 ? (
          <>
            {[...Array(10)].map((_, i) => (
              <div key={`sk-${i}`} className="grid grid-cols-[1fr_1.2fr_1.5fr_1fr_100px_70px] gap-4 px-5 py-5 items-center">
                <div>
                  <div className="h-3 w-24 rounded-sm bg-white/[0.04] animate-pulse" />
                </div>
                <div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded-sm bg-white/[0.04] animate-pulse" />
                    <div className="h-3 w-12 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="h-3 w-32 rounded-sm bg-white/[0.04] animate-pulse" />
                </div>
                <div>
                  <div className="flex gap-2">
                    <div className="h-3 w-16 rounded-sm bg-white/[0.04] animate-pulse" />
                    <div className="h-3 w-16 rounded-sm bg-white/[0.04] animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="h-4 w-16 rounded-full bg-white/[0.04] animate-pulse" />
                </div>
                <div className="flex justify-end">
                  <div className="h-7 w-7 rounded bg-white/[0.04] animate-pulse" />
                </div>
              </div>
            ))}
          </>
        ) : (
          logs.map((log) => (
            <React.Fragment key={log._id}>
              <div 
                className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] md:grid-cols-[1fr_1.2fr_1.5fr_1fr_100px_70px] md:items-center cursor-pointer" 
                onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}
              >
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Time</p>
                  <div className="flex items-center gap-2 text-xs text-white/35">
                    <i className="fas fa-clock text-white/15"></i>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Actor</p>
                  <div className="space-y-1">
                    {log.actorId ? (
                      <Link 
                        href={`/admin/users/${log.actorId}`}
                        className="truncate text-xs font-medium text-white/70 hover:text-white transition-colors block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.actorUsername || log.actorId}
                      </Link>
                    ) : (
                      <span className="text-white/25 text-xs">-</span>
                    )}
                    <div>
                      {getRoleBadge(log.actorRole)}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Action</p>
                  <div className="flex items-center gap-2 text-xs text-white/70 font-medium">
                    <i className={`fas ${getActionIcon(log.action)}`}></i>
                    <span className="truncate">{log.action}</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Resource</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-[#1A1A1A] text-white/35 rounded border border-white/[0.04]">
                      {log.resourceType}
                    </span>
                    {log.resourceId && (
                      <span className="font-mono text-white/25 truncate max-w-[80px]">{log.resourceId.slice(-8)}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Status</p>
                  {getSuccessBadge(log.success ?? (log.meta as any)?.success)}
                </div>
                <div className="min-w-0 md:text-right">
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
