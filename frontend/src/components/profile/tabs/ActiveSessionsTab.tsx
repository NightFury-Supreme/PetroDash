'use client';

import React, { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Smartphone, Tablet, Laptop, LogOut, MapPin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Session } from '@/hooks/profile';
import { InfoRow, SectionHeading } from '@/components/ui/logs';
import { ActiveSessionsSkeleton } from '@/components/skeletons/profile';

export function ActiveSessions({
  sessions,
  loading = false,
  onRevoke,
}: {
  sessions: Session[];
  loading?: boolean;
  onRevoke: (id: string) => Promise<void> | void;
}) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRevoke = async (id: string) => {
    if (revokingId) return;
    setRevokingId(id);
    try {
      await onRevoke(id);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('activeSessions')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('activeSessionsDesc')}</p>
          </div>
        </div>

        {loading ? (
          <ActiveSessionsSkeleton showHeader={true} />
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <Laptop size={28} className="mb-3 text-white/40" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-white/90">{t('noActiveSessions')}</p>
            <p className="mt-1 text-xs text-white/40">{t('noOtherDevices')}</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[1fr_220px_72px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/40 md:grid">
              <span>{t('device')}</span>
              <span className="md:text-right">{tCommon('location')}</span>
              <span className="text-right">{t('action')}</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {sessions.map((session, index) => {
                const rowId = session.id || session.ip || String(index);
                return (
                  <SessionRow
                    key={rowId}
                    session={session}
                    onRevoke={() => handleRevoke(session.id)}
                    isRevoking={revokingId === session.id}
                    disabled={Boolean(revokingId)}
                    isExpanded={expandedId === rowId}
                    onToggle={() => toggleExpand(rowId)}
                  />
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SessionRow({
  session,
  onRevoke,
  isRevoking,
  disabled,
  isExpanded,
  onToggle,
}: {
  session: Session;
  onRevoke: () => void;
  isRevoking: boolean;
  disabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');
  const tUI = useTranslations('UI');
  const format = useFormatter();

  const isTablet = session.deviceType === 'tablet' || session.device?.toLowerCase().includes('tablet') || session.device?.toLowerCase().includes('ipad');
  const isMobile = session.deviceType === 'mobile' || session.device?.toLowerCase().includes('phone') || session.device?.toLowerCase().includes('android');
  const DeviceIcon = isTablet ? Tablet : isMobile ? Smartphone : Laptop;
  const unknownLabel = tCommon('unknown');
  const displayLocation = !session.location || session.location === 'Unknown Location' ? unknownLabel : session.location;

  const lastActiveDate = session.lastActive ? new Date(session.lastActive) : null;
  const formattedLastActive = lastActiveDate && !isNaN(lastActiveDate.getTime())
    ? format.dateTime(lastActiveDate, { dateStyle: 'medium', timeStyle: 'short' })
    : unknownLabel;

  const createdDate = session.createdAt ? new Date(session.createdAt) : null;
  const formattedCreated = createdDate && !isNaN(createdDate.getTime())
    ? format.dateTime(createdDate, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="transition">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="px-5 py-4 transition hover:bg-white/[0.02] cursor-pointer focus:outline-none"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_72px] md:items-center md:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-white/50">
              <DeviceIcon size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white/90 truncate">{session.device}</p>
                {session.current && (
                  <span className="text-[11px] font-medium text-emerald-400">
                    {t('thisDevice')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                <span className="capitalize">{session.deviceType || 'Desktop'}</span>
                <span className="text-white/20">•</span>
                <span className="truncate max-w-[180px]">{session.browser}</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex items-center md:justify-end">
            <span className="flex items-center gap-1.5 text-xs text-white/70 truncate" title={displayLocation}>
              <MapPin size={12} className="shrink-0 text-white/40" />
              <span className="truncate">{displayLocation}</span>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {!session.current && (
              <button
                type="button"
                onClick={onRevoke}
                disabled={disabled}
                title={t('signOut')}
                aria-label={t('signOut')}
                className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none"
              >
                {isRevoking ? (
                  <Loader2 size={13} className="animate-spin text-red-400" />
                ) : (
                  <LogOut size={13} />
                )}
              </button>
            )}
            <button
              type="button"
              aria-label={isExpanded ? tCommon('collapse') : tCommon('expand')}
              onClick={onToggle}
              className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded text-white/40 hover:text-white/80 transition-colors focus:outline-none"
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pt-3 pb-6 border-t border-white/[0.04] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-14 gap-y-6 w-full min-w-0">
            <div>
              <SectionHeading>{tCommon('sessionInformation')}</SectionHeading>
              {session.id && (
                <InfoRow label={tUI('sessionId')} value={session.id} mono muted copyable />
              )}
              <InfoRow label={tCommon('device')} value={session.device} />
              <InfoRow label={tCommon('deviceType')} value={session.deviceType ? session.deviceType.toUpperCase() : 'DESKTOP'} mono />
              <InfoRow label={tCommon('browser')} value={session.browser} />
            </div>

            <div>
              <SectionHeading>{tCommon('networkLocation')}</SectionHeading>
              <InfoRow label={tUI('ipAddress')} value={session.ip || unknownLabel} mono copyable />
              <InfoRow label={tCommon('location')} value={displayLocation} />
              {formattedCreated && (
                <InfoRow label={tCommon('signedIn')} value={formattedCreated} />
              )}
              <InfoRow label={tCommon('lastActive')} value={formattedLastActive} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
