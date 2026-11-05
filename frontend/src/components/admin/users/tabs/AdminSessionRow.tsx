'use client';

import React from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { Smartphone, Tablet, Laptop, LogOut, MapPin, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { InfoRow, SectionHeading } from '@/components/ui/logs';
import type { AdminUserSession } from '@/hooks/admin/users/types';

interface AdminSessionRowProps {
  session: AdminUserSession;
  onRevoke: () => void;
  isRevoking: boolean;
  disabled: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AdminSessionRow({
  session,
  onRevoke,
  isRevoking,
  disabled,
  isExpanded,
  onToggle,
}: AdminSessionRowProps) {
  const t = useTranslations('admin.users');
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
            <button
              type="button"
              onClick={onRevoke}
              disabled={disabled}
              title={t('revokeSession')}
              aria-label={t('revokeSession')}
              className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none"
            >
              {isRevoking ? (
                <Loader2 size={13} className="animate-spin text-red-400" />
              ) : (
                <LogOut size={13} />
              )}
            </button>
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

export default AdminSessionRow;
