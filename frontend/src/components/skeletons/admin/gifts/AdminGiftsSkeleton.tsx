'use client';

import React from 'react';
import { Search, SlidersHorizontal, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface AdminGiftsSkeletonProps {
  rows?: number;
}

export function AdminGiftsSkeleton({ rows = 5 }: AdminGiftsSkeletonProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');
  const cols = 'lg:grid-cols-[1.2fr_1fr_1.8fr_80px_100px_80px_100px]';

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
          <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
        </div>
        <div className="h-[28px] w-24 rounded-md bg-[#202020] border border-white/[0.06] animate-pulse" />
      </div>

      <section className="mt-[25px]">
        <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
          <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] w-full">
            <Search size={15} className="text-[#5e5e5e] shrink-0" />
            <div className="w-32 h-3 bg-[#222] rounded animate-pulse" />
          </div>

          <div className="flex items-center gap-[7px] w-full sm:w-auto">
            <div className="w-full sm:w-[115px] h-[42px] rounded-lg border border-[#282828] bg-[#121212] px-3 flex items-center justify-between">
              <div className="flex items-center gap-[7px]">
                <SlidersHorizontal size={14} className="text-[#858585] shrink-0" />
                <span className="text-xs text-[#858585]">{tCommon('filters')}</span>
              </div>
              <ChevronDown size={14} className="text-[#858585] shrink-0" />
            </div>

            <div className="w-full sm:w-[180px] h-[42px] rounded-lg border border-[#282828] bg-[#121212] px-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={14} className="text-[#858585] shrink-0" />
                <span className="text-xs text-[#858585]">{tCommon('sort')}</span>
              </div>
              <ChevronDown size={14} className="text-[#858585] shrink-0" />
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
            <span>{t('code')}</span>
            <span>{t('creator')}</span>
            <span>{t('rewards')}</span>
            <span>{t('uses')}</span>
            <span>{t('expires')}</span>
            <span>{tCommon('status')}</span>
            <span className="text-right">{t('actions')}</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 gap-4 px-5 py-5 ${cols} lg:items-center`}
              >
                <div className="min-w-0">
                  <div className="w-10 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-28 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="w-20 h-2.5 bg-[#222] rounded animate-pulse mt-1" />
                </div>

                <div className="min-w-0">
                  <div className="w-12 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2a2a2a] animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="w-20 h-3.5 bg-[#2a2a2a] rounded animate-pulse" />
                      <div className="w-28 h-2.5 bg-[#222] rounded animate-pulse mt-1" />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="w-12 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-3 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="w-1.5 h-2.5 bg-[#222] rounded animate-pulse" />
                    <div className="w-16 h-3 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="w-1.5 h-2.5 bg-[#222] rounded animate-pulse" />
                    <div className="w-14 h-3 bg-[#2a2a2a] rounded animate-pulse" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="w-10 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-12 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="w-12 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="w-10 h-2 bg-[#222] rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-14 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                </div>

                <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                  <div className="flex lg:justify-end gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#202020] border border-white/[0.04] animate-pulse" />
                    <div className="w-7 h-7 rounded-md bg-[#202020] border border-white/[0.04] animate-pulse" />
                    <div className="w-7 h-7 rounded-md bg-[#202020] border border-white/[0.04] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminGiftsSkeleton;
