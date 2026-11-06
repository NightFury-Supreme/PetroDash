'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Users, Coins, CheckCircle2, Link2, Pencil } from 'lucide-react';
import { SummaryItem } from '@/components/referrals/SummaryItem';
import { ReferredUsersTableSkeleton } from './ReferredUsersTableSkeleton';

export default function ReferralsSkeleton() {
  const t = useTranslations('Referrals');

  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-32 bg-[#2a2a2a] animate-pulse rounded" />
              </div>
              <div className="h-4 w-64 bg-[#222] animate-pulse rounded" />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 border-y border-white/[0.06] sm:grid-cols-3">
          <SummaryItem icon={<Users size={16} />} label={t('usersReferred')} value={0} suffix={t('suffixUsers')} loading={true} />
          <SummaryItem icon={<Coins size={16} />} label={t('coinsEarned')} value={0} suffix={t('suffixCoins')} loading={true} />
          <SummaryItem icon={<CheckCircle2 size={16} />} label={t('successful')} value={0} suffix={t('suffixRewards')} loading={true} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="h-3.5 w-24 bg-[#222] animate-pulse rounded mb-2" />
              <div className="h-4 w-48 bg-[#2a2a2a] animate-pulse rounded" />
            </div>
            <Link2 size={15} className="text-white/20" />
          </div>

          <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-[#141414]">
            <div className="flex h-12 w-full items-center px-4">
              <div className="h-4 w-64 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] pt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#202020] border border-white/[0.06]">
                <Pencil size={16} className="text-white/25" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="h-4 w-36 bg-[#2a2a2a] animate-pulse rounded" />
                </div>
                <div className="h-3 w-64 rounded bg-[#222] animate-pulse" />
              </div>
            </div>

            <button
              type="button"
              disabled
              aria-label={t('locked')}
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-medium transition-all cursor-not-allowed border-white/[0.06] bg-[#202020]"
            >
              <div className="h-4 w-16 rounded bg-[#2a2a2a] animate-pulse" />
            </button>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between border-t border-white/[0.06] pt-7">
            <div>
              <div className="h-5 w-32 bg-[#2a2a2a] animate-pulse rounded mb-2" />
              <div className="h-3 w-48 bg-[#222] animate-pulse rounded" />
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(300px,1fr)_180px_140px] items-center border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
            <div className="h-2.5 w-12 bg-[#222] animate-pulse rounded" />
            <div className="h-2.5 w-12 bg-[#222] animate-pulse rounded" />
            <div className="flex justify-end">
              <div className="h-2.5 w-12 bg-[#222] animate-pulse rounded" />
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            <ReferredUsersTableSkeleton rows={5} />
          </div>
        </section>
      </div>
    </div>
  );
}
