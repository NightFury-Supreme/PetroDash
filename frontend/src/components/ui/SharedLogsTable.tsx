import React, { useState, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import type { LogEntry, SharedLogsTableProps } from './logs/logTypes';
import { parseUserAgent } from './logs/logHelpers';
import { ActionCell, StatusBadge, ExpandedPanel } from './logs/LogRowDetail';

export type { LogEntry, SharedLogsTableProps };

function RequestIdCell({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [id]);

  return (
    <div className="min-w-0 hidden md:block" onClick={handleCopy} title={copied ? '✓ Copied' : id}>
      <div
        className={`font-mono text-[10px] truncate cursor-pointer transition-colors select-none px-1.5 py-0.5 rounded ${
          copied
            ? 'text-emerald-400 bg-emerald-500/10'
            : 'text-white/30 hover:text-white/55 hover:bg-white/[0.03]'
        }`}
      >
        {id.slice(-8)}
      </div>
    </div>
  );
}

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const t = useTranslations('UI');
  const tCommon = useTranslations('Common');
  const format = useFormatter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="w-full font-sans">
      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_88px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/40">
        <span>{tCommon('action')}</span>
        <span>{tCommon('deviceBrowser')}</span>
        <span>{tCommon('status')}</span>
        <span>{t('date')}</span>
        <span>{t('requestId')}</span>
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
            <ClipboardList size={24} className="opacity-50" />
            <p className="text-xs">{t('noActivity')}</p>
          </div>
        )}

        {!loading && logs.map(log => {
          const meta       = log.meta ?? log.metadata ?? {};
          const isExpanded = expandedId === log._id;
          const ip         = log.ip ?? meta.ip;
          const isByAdmin  = Boolean(
            meta.adminUsername ||
            meta.adminId ||
            meta.performedByAdmin ||
            meta.updatedByAdmin ||
            meta.clearedByAdmin ||
            meta.deletedByAdmin ||
            (typeof log.action === 'string' && log.action.startsWith('admin.'))
          );

          return (
            <React.Fragment key={log._id}>
              {/* Row */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                className="group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_88px_44px] gap-4 px-5 py-5 items-center transition hover:bg-white/[0.02] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
                onClick={() => toggle(log._id)}
                onKeyDown={e => e.key === 'Enter' && toggle(log._id)}
              >
                {/* Action */}
                <ActionCell log={log} variant={variant} meta={meta} />

                {/* Device / IP */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">{t('device')}</p>
                  <div className="text-[11px] text-white/65 font-mono truncate">
                    {ip ? (ip === '::1' ? '127.0.0.1' : (typeof ip === 'string' && ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip)) : (isByAdmin && variant === 'user' ? tCommon('protected') : '-')}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/40">
                    {parseUserAgent(
                      log.userAgent ?? meta.userAgent,
                      isByAdmin && variant === 'user' ? tCommon('staffAction') : tCommon('unknown')
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">{tCommon('status')}</p>
                  <StatusBadge log={log} />
                </div>

                {/* Date */}
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">{t('date')}</p>
                  <div className="text-[11px] text-white/55">
                    {format.dateTime(new Date(log.createdAt), {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>

                {/* Request ID */}
                <RequestIdCell id={log._id} />

                {/* Expand toggle */}
                <div className="flex md:justify-end">
                  <button
                    aria-label={isExpanded ? tCommon('collapse') : tCommon('expand')}
                    className="w-6 h-6 inline-flex items-center justify-center rounded text-white/40 hover:text-white/70 transition-colors focus:outline-none"
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
