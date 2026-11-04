'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface AdminSuspendedTabSkeletonProps {
  rows?: number;
}

export function AdminSuspendedTabSkeleton({ rows = 6 }: AdminSuspendedTabSkeletonProps) {
  const t = useTranslations('admin.servers');

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_160px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
        <span>{t('serverName')}</span>
        <span>{t('owner')}</span>
        <span>{t('node')}</span>
        <span>{t('egg')}</span>
        <span>{t('status')}</span>
        <span>{t('cpu')}</span>
        <span>{t('ram')}</span>
        <span>{t('disk')}</span>
        <span className="text-right">{t('actions')}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_160px] lg:items-center"
          >
            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('serverName')}
              </p>
              <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse mb-1" />
              <div className="h-2.5 w-24 bg-[#222] rounded animate-pulse" />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('owner')}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2a2a2a] animate-pulse shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3.5 w-20 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-2.5 w-28 bg-[#222] rounded animate-pulse" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('node')}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-4 bg-[#2a2a2a] rounded-[2px] animate-pulse shrink-0" />
                <div className="h-4 w-20 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('egg')}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#2a2a2a] rounded animate-pulse shrink-0" />
                <div className="h-4 w-20 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('status')}
              </p>
              <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse" />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('cpu')}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-[#222] rounded animate-pulse shrink-0" />
                <div className="h-4 w-10 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('ram')}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-[#222] rounded animate-pulse shrink-0" />
                <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                {t('disk')}
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-[#222] rounded animate-pulse shrink-0" />
                <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse" />
              </div>
            </div>

            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <div className="w-7 h-7 rounded-md bg-[#222] animate-pulse" />
                <div className="w-7 h-7 rounded-md bg-[#222] animate-pulse" />
                <div className="w-7 h-7 rounded-md bg-[#222] animate-pulse" />
                <div className="w-7 h-7 rounded-md bg-[#222] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminSuspendedTabSkeleton;

