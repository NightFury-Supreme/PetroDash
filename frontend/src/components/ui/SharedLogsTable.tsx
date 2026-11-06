import React, { useState, useCallback } from 'react';
import { ClipboardList, Copy, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslations, useFormatter } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { ActivityLogSkeleton } from '@/components/skeletons/profile';
import {
  ActionCell,
  StatusBadge,
  ExpandedPanel,
  parseUserAgent,
  type LogEntry,
  type SharedLogsTableProps,
} from './logs';

export type { LogEntry, SharedLogsTableProps };

function RequestIdCell({ id }: { id?: string }) {
  const [copied, setCopied] = useState(false);
  const tCommon = useTranslations('Common');
  const { showSuccess } = useToast();

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!id) return;
      navigator.clipboard.writeText(id).then(() => {
        setCopied(true);
        showSuccess(tCommon('copiedSuccess'));
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [id, showSuccess, tCommon]
  );

  return (
    <div
      className="min-w-0 hidden md:flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="font-mono text-[10px] text-white/35 select-none">
        {typeof id === 'string' && id.length > 0 ? id.slice(-8) : '-'}
      </span>
      {typeof id === 'string' && id.length > 0 && (
        <button
          type="button"
          onClick={handleCopy}
          title={tCommon('copy')}
          aria-label={tCommon('copy')}
          className="inline-flex items-center justify-center rounded p-1 text-white/30 transition-colors hover:text-white/75 focus:outline-none"
        >
          {copied ? (
            <Check size={11} className="text-emerald-400" />
          ) : (
            <Copy size={11} />
          )}
        </button>
      )}
    </div>
  );
}

export function SharedLogsTable({ logs, loading, variant }: SharedLogsTableProps) {
  const t = useTranslations('UI');
  const tCommon = useTranslations('Common');
  const format = useFormatter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="w-full font-sans">
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/40">
        <span>{tCommon('action')}</span>
        <span>{tCommon('deviceBrowser')}</span>
        <span>{tCommon('status')}</span>
        <span>{t('date')}</span>
        <span>{t('requestId')}</span>
        <span />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {loading && <ActivityLogSkeleton showHeader={false} />}

        {!loading && logs.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/40">
            <ClipboardList size={24} className="opacity-50" />
            <p className="text-xs">{t('noActivity')}</p>
          </div>
        )}

        {!loading &&
          logs.map((log) => {
            const meta = log.meta ?? log.metadata ?? {};
            const isExpanded = expandedId === log.id;
            const ip = log.ip ?? meta.ip;
            const isStaff = log.actorType === 'staff';
            const isSystem = log.actorType === 'system';
            const isSelf = log.actorType === 'self' || (!isStaff && !isSystem);

            return (
              <React.Fragment key={log.id}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  className="group grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 py-5 items-center transition hover:bg-white/[0.02] cursor-pointer focus:outline-none"
                  onClick={() => toggle(log.id)}
                  onKeyDown={(e) => e.key === 'Enter' && toggle(log.id)}
                >
                  <ActionCell log={log} variant={variant} meta={meta} />

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">
                      {t('device')}
                    </p>
                    {variant === 'user' && !isSelf ? (
                      <div className="text-[11px] text-white/30 font-mono">-</div>
                    ) : (
                      <>
                        <div className="text-[11px] text-white/65 font-mono truncate">
                          {ip
                            ? ip === '::1'
                              ? '127.0.0.1'
                              : typeof ip === 'string' && ip.startsWith('::ffff:')
                                ? ip.replace('::ffff:', '')
                                : ip
                            : '-'}
                        </div>
                        <div className="mt-0.5 text-[10px] text-white/40 flex items-center gap-1.5 truncate">
                          <span className="truncate">
                            {parseUserAgent(log.userAgent ?? meta.userAgent, tCommon('unknown'))}
                          </span>
                          {log.location && log.location !== 'Unknown Location' && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="truncate text-white/50">{log.location}</span>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">
                      {tCommon('status')}
                    </p>
                    <StatusBadge log={log} />
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 md:hidden">
                      {t('date')}
                    </p>
                    <div className="text-[11px] text-white/55">
                      {(() => {
                        try {
                          const d = new Date(log.createdAt);
                          if (isNaN(d.getTime())) return '-';
                          return format.dateTime(d, {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                        } catch {
                          return '-';
                        }
                      })()}
                    </div>
                  </div>

                  <RequestIdCell id={log.id} />

                  <div className="flex md:justify-end">
                    <button
                      type="button"
                      aria-label={isExpanded ? tCommon('collapse') : tCommon('expand')}
                      className="w-6 h-6 inline-flex items-center justify-center rounded text-white/40 hover:text-white/70 transition-colors focus:outline-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(log.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {isExpanded && <ExpandedPanel log={log} variant={variant} meta={meta} />}
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
}
