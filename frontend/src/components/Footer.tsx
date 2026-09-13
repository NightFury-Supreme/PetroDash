"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useState, useEffect } from 'react';
import packageInfo from '../../package.json';

interface BrandingInfo {
  siteName: string;
  siteIcon: string;
}

export default function Footer() {
  const [branding, setBranding] = useState<BrandingInfo>({ siteName: 'PteroDash', siteIcon: '' });
  const [sysStatus, setSysStatus] = useState<'loading' | 'online' | 'partial' | 'offline'>('loading');
  const currentYear = new Date().getFullYear();

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
        
        let offlineNodes = 0;
        let totalNodes = 0;
        if (data.nodes) {
          totalNodes = data.nodes.length;
          data.nodes.forEach((n: any) => {
            if (n.status !== 'Operational') offlineNodes++;
          });
        }
        
        const isPanelOffline = data.panel?.status !== 'Operational';
        
        if (isPanelOffline && (offlineNodes === totalNodes && totalNodes > 0)) {
          setSysStatus('offline');
        } else if (isPanelOffline || offlineNodes > 0) {
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
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></span>
                <span className="text-[#555]">Checking Systems...</span>
              </>
            )}
            {sysStatus === 'online' && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">All Systems Operational</span>
              </>
            )}
            {sysStatus === 'partial' && (
              <>
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">Partial Outage</span>
              </>
            )}
            {sysStatus === 'offline' && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="hover:text-white transition-colors">Major Outage</span>
              </>
            )}
          </div>
          <span className="text-[#333]">•</span>
          <span>
            Powered by{' '}
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
