'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export interface AdminEarnSkeletonProps {
  rows?: number;
}

export function AdminEarnSkeleton({ rows = 1 }: AdminEarnSkeletonProps) {
  const t = useTranslations('admin.earn');
  const cols = 'lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]';

  return (
    <div className="mt-8 w-full animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
        <span>{t('table.method')}</span>
        <span>{t('table.description')}</span>
        <span>{t('table.reward')}</span>
        <span>{t('table.dailyLimit')}</span>
        <span>{t('table.status')}</span>
        <span className="text-right">{t('table.actions')}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className={`grid grid-cols-1 gap-4 px-5 py-5 ${cols} lg:items-center`}>
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse" />
              <div className="min-w-0 flex-1">
                <div className="w-10 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                <div className="w-24 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="w-28 h-2.5 bg-[#222] rounded animate-pulse mt-1" />
              </div>
            </div>

            <div className="min-w-0 hidden lg:block">
              <div className="w-56 h-4 bg-[#222] rounded animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="w-12 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
              <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="w-16 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
              <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="w-10 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
              <div className="w-14 h-4 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <div className="w-7 h-7 rounded-md bg-[#202020] border border-white/[0.04] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminEarnSkeleton;
