"use client";

import React, { useMemo } from 'react';
import packageInfo from '../../package.json';
import { useTranslations } from 'next-intl';
import { useBranding } from '@/hooks/useBranding';
import { useSystemStatus } from '@/hooks/dashboard';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps = {}) {
  const { branding } = useBranding();
  const { data: statusData, loading: statusLoading, error: statusError } = useSystemStatus(60000);
  const currentYear = new Date().getFullYear();
  const t = useTranslations('Footer');
  const tStatus = useTranslations('Dashboard');

  const sysStatus = useMemo<'loading' | 'online' | 'partial' | 'offline'>(() => {
    if (statusLoading) return 'loading';
    if (statusError || !statusData) return 'offline';

    const allStatuses = [statusData.panel?.status, ...(statusData.nodes || []).map((n) => n.status)];
    if (allStatuses.some((s) => s === 'Major Outage')) {
      return 'offline';
    } else if (allStatuses.some((s) => s === 'Partial Outage' || s === 'Degraded')) {
      return 'partial';
    } else if (allStatuses.some((s) => s && s !== 'Operational')) {
      return 'partial';
    }
    return 'online';
  }, [statusLoading, statusError, statusData]);

  return (
    <footer className={`w-full py-6 px-4 sm:px-6 ${className ?? 'mt-12'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-[#555]">
        {/* Left - Copyright */}
        <div className="flex items-center gap-2">
          <span>© {currentYear} {branding.siteName}</span>
        </div>

        {/* Right - Links / Credits */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 cursor-default">
            {sysStatus === 'loading' && (
              <>
                <span className="w-2 h-2 rounded-full bg-[#333] animate-pulse"></span>
                <div className="h-3 w-28 bg-[#222] rounded animate-pulse"></div>
              </>
            )}
            {sysStatus === 'online' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">{tStatus('allNormal')}</span>
              </>
            )}
            {sysStatus === 'partial' && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">{tStatus('someIssues')}</span>
              </>
            )}
            {sysStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">{tStatus('majorOutage')}</span>
              </>
            )}
          </div>
          <span className="text-[#333]">•</span>
          <span>
            {t('poweredBy')}{' '}
            <a 
              href="https://github.com/NightFury-Supreme/PetroDash" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white transition-colors font-medium text-[#777]"
            >
              PteroDash v{packageInfo.version}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
