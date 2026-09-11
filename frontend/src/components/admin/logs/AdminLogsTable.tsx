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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/30">
              <th className="px-5 pb-3 font-medium">Time</th>
              <th className="px-5 pb-3 font-medium">Actor</th>
              <th className="px-5 pb-3 font-medium">Action</th>
              <th className="px-5 pb-3 font-medium">Resource</th>
              <th className="px-5 pb-3 font-medium">Status</th>
              <th className="px-5 pb-3 font-medium text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading && logs.length === 0 ? (
              [...Array(10)].map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  <td className="px-5 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-white/5 rounded" />
                      <div className="h-4 w-12 bg-white/5 rounded" />
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <div className="h-4 w-16 bg-white/5 rounded" />
                      <div className="h-4 w-16 bg-white/5 rounded" />
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-4 w-16 bg-white/5 rounded" /></td>
                  <td className="px-5 py-4 text-right"><div className="h-7 w-7 bg-white/5 rounded inline-block" /></td>
                </tr>
              ))
            ) : (
              logs.map((log) => (
              <React.Fragment key={log._id}>
                <tr className="group hover:bg-white/[0.015] transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === log._id ? null : log._id)}>
                  <td className="px-5 py-4 text-sm text-[#ddd]">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-clock text-[#555] text-xs"></i>
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#ddd]">
                    <div className="space-y-1">
                      {log.actorId ? (
                        <Link 
                          href={`/admin/users/${log.actorId}`}
                          className="font-medium hover:text-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {log.actorUsername || log.actorId}
                        </Link>
                      ) : (
                        <span className="text-[#555]">-</span>
                      )}
                      <div>
                        {getRoleBadge(log.actorRole)}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#ddd]">
                    <div className="flex items-center gap-2">
                      <i className={`fas ${getActionIcon(log.action)}`}></i>
                      <span className="font-medium">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#ddd]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#1A1A1A] text-[#888] rounded text-xs border border-white/[0.04]">
                        {log.resourceType}
                      </span>
                      {log.resourceId && (
                        <span className="font-mono text-xs text-[#555]">{log.resourceId.slice(-8)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getSuccessBadge(log.meta?.success as boolean | undefined)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="w-7 h-7 inline-flex items-center justify-center rounded border border-[#282828] bg-[#121212] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors">
                      <i className={`fas fa-chevron-${expandedRow === log._id ? 'up' : 'down'} text-xs`}></i>
                    </button>
                  </td>
                </tr>
                
                {/* Expanded Row Details */}
                {expandedRow === log._id && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 bg-[#0a0a0a] border-t border-white/[0.06]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                        {/* Basic Info */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#555] font-semibold">Request Information</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-[#888]">IP Address</span>
                              <span className="text-[#ddd] font-mono bg-white/[0.02] px-2 py-0.5 rounded text-xs">{log.ip || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-[#888]">Method</span>
                              <span className="text-[#ddd]">{log.method || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-[#888]">Path</span>
                              <span className="text-[#ddd] font-mono text-xs">{log.path || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                              <span className="text-[#888]">Status Code</span>
                              <span className={`font-medium ${log.statusCode && log.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                                {log.statusCode || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#888]">Duration</span>
                              <span className="text-[#ddd]">{formatDuration(log.durationMs)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Meta Data */}
                        <div className="space-y-4">
                          <h4 className="text-[10px] uppercase tracking-widest text-[#555] font-semibold">Additional Meta</h4>
                          <div className="bg-[#111] border border-[#222] rounded-lg p-3">
                            <pre className="text-xs text-[#888] whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
