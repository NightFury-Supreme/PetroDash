import { Smartphone, Globe, LogOut, Clock3, Laptop } from "lucide-react";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Session } from '@/hooks/useProfile';




function parseUserAgent(ua: string, fallbackOS: string = 'Unknown OS', fallbackBrowser: string = 'Unknown Browser') {
  if (!ua) return { os: fallbackOS, browser: fallbackBrowser };
  let os = fallbackOS, browser = fallbackBrowser;
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  return { os, browser };
}




export function ActiveSessions({ sessions, onRevoke }: { sessions: Session[]; onRevoke: (id: string) => void; }) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#222] bg-[#161616] p-4">
        <div className="flex gap-3">
          <Clock3 size={16} className="mt-0.5 shrink-0 text-[#666]" />
          <p className="text-xs text-[#888]">{t('unrecognizedDeviceWarning')}</p>
        </div>
      </div>
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('activeSessions')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('activeSessionsDesc')}</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-white/5">
              <Laptop size={18} className="text-[#888]" />
            </div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{t('noActiveSessions')}</p>
            <p className="mt-1 text-xs text-[#888]">{t('noOtherDevices')}</p>
          </div>
        ) : (
          <>
            <div className="hidden gap-4 grid-cols-[minmax(250px,1fr)_1fr_150px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
              <span>{t('device')}</span>
              <span className="md:text-right">{t('details')}</span>
              <span className="text-right">{t('action')}</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {sessions.map((session) => <SessionRow key={session.id} session={session} onRevoke={() => onRevoke(session.id)} t={t} tCommon={tCommon} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SessionRow({ session, onRevoke, t, tCommon }: { session: Session; onRevoke: () => void; t?: any; tCommon?: any; }) {
  const DeviceIcon = session.deviceType === "mobile" || session.deviceType === "tablet" ? Smartphone : Laptop;
  const unknownLabel = tCommon ? tCommon('unknown') : 'Unknown';
  
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <DeviceIcon size={18} className="text-[#D4D4D4]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#D4D4D4]">{session.device}</p>
              {session.current && <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-400">{t ? t('thisDevice') : 'This device'}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center md:justify-end min-w-0">
          <div className="flex flex-wrap items-center md:justify-end gap-x-3 gap-y-1 text-xs text-[#888]">
            <span className="truncate max-w-[200px]" title={session.browser}>{typeof session.browser === 'string' && session.browser.includes('Mozilla') ? parseUserAgent(session.browser, unknownLabel + ' OS', unknownLabel + ' Browser').browser : session.browser as string}</span>
            <span className="text-[#444]">•</span>
            <span className="flex items-center gap-1"><Globe size={12} /> {session.ip || unknownLabel}</span>
            <span className="text-[#444]">•</span>
            <span>{session.lastActive ? new Date(session.lastActive).toLocaleString() : unknownLabel}</span>
            <span className="text-[#444]">•</span>
            <span className="font-mono text-[10px]">ID: {session.id}</span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          {!session.current && (
            <button type="button" onClick={onRevoke} className="flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-md border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-[11px] font-medium text-[#888] hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition-all sm:self-auto">
              <LogOut size={11} /> {t ? t('signOut') : 'Sign out'}
            </button>
          )}
          {session.current && (
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {t ? t('activeNow') : 'Active now'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

