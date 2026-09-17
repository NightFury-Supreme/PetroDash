import React from 'react';
import { Users, Coins, CheckCircle2, Link2, Pencil } from 'lucide-react';
import { SummaryItem } from '@/components/referrals/SummaryItem';

export default function ReferralsSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">
        {/* HEADER */}
        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-32 bg-[#1a1a1a] animate-pulse rounded" />
              <div className="h-3 w-24 bg-[#1a1a1a] animate-pulse rounded mb-2" />
              <div className="h-4 w-48 bg-[#1a1a1a] animate-pulse rounded" />
            </div>
            <Link2 size={15} className="text-white/20" />
          </div>

          <div className="flex overflow-hidden rounded-lg border border-white/[0.08] bg-[#141414]">
            <div className="flex h-12 w-full items-center px-4">
              <div className="h-4 w-64 rounded bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        </section>

        {/* CUSTOM REFERRAL CODE */}
        <section className="border-t border-white/[0.07] pt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                <Pencil size={16} className="text-white/25" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="h-4 w-36 bg-[#1a1a1a] animate-pulse rounded" />
                </div>
                <div className="h-3 w-64 rounded bg-[#1a1a1a] animate-pulse" />
              </div>
            </div>

            <button
              type="button"
              disabled
              className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-medium transition-all cursor-not-allowed border-white/[0.06] bg-transparent"
            >
              <div className="h-4 w-16 rounded bg-white/[0.04] animate-pulse" />
            </button>
          </div>
        </section>

        {/* REFERRED USERS */}
        <section>
          <div className="mb-5 flex items-end justify-between border-t border-white/[0.07] pt-7">
            <div>
              <div className="h-5 w-32 bg-[#1a1a1a] animate-pulse rounded mb-2" />
              <div className="h-3 w-48 bg-[#1a1a1a] animate-pulse rounded" />
            </div>
          </div>

          {/* TABLE HEADER */}
          <div className="hidden grid-cols-[minmax(300px,1fr)_180px_140px] items-center border-b border-white/[0.06] px-5 pb-3 md:grid">
            <div className="h-3 w-12 bg-[#1a1a1a] animate-pulse rounded" />
            <div className="h-3 w-12 bg-[#1a1a1a] animate-pulse rounded" />
            <div className="flex justify-end">
              <div className="h-3 w-12 bg-[#1a1a1a] animate-pulse rounded" />
            </div>
          </div>

          {/* USER LIST SKELETON */}
          <div className="divide-y divide-white/[0.06]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-[minmax(300px,1fr)_180px_140px] gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.04] animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded-sm bg-white/[0.04] animate-pulse" />
                    <div className="h-2 w-32 rounded-sm bg-white/[0.02] animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-20 rounded-sm bg-white/[0.04] animate-pulse" />
                </div>
                <div className="flex items-center justify-end">
                  <div className="h-4 w-16 rounded-full bg-white/[0.04] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
