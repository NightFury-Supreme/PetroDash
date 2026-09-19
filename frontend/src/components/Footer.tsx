"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState, useEffect } from 'react';
import packageInfo from '../../package.json';
import { useTranslations } from 'next-intl';

interface BrandingInfo {
  siteName: string;
  siteIcon: string;
}

export default function Footer() {
  const [branding, setBranding] = useState<BrandingInfo>({ siteName: 'PteroDash', siteIcon: '' });
  const [sysStatus, setSysStatus] = useState<'loading' | 'online' | 'partial' | 'offline'>('loading');
  const currentYear = new Date().getFullYear();
  const t = useTranslations('Footer');
    const tStatus = useTranslations('Dashboard');

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/branding`, { cache: 'no-store' });
        let data: any = {}; try { data = await res.json(); } catch {}
        if (data?.siteName) {
          setBranding(data);
        }
      } catch {
        // Use default branding if fetch fails
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/status`);
        if (!res.ok) throw new Error('Status fetch failed');
        const data = await res.json();
        
                  const allStatuses = [data.panel?.status, ...(data.nodes || []).map((n: any) => n.status)];
          if (allStatuses.some((s: string) => s === 'Major Outage')) {
            setSysStatus('offline');
          } else if (allStatuses.some((s: string) => s === 'Partial Outage' || s === 'Degraded')) {
            setSysStatus('partial');
          } else if (allStatuses.some((s: string) => s && s !== 'Operational')) {
            setSysStatus('partial');
          } else {
            setSysStatus('online');
          }
      } catch {
        setSysStatus('offline');
      }
    };

    fetchBranding();
    fetchStatus();
  }, []);

  return (
    <footer className="w-full py-6 mt-12 px-4 sm:px-6">
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
