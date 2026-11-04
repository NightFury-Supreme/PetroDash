'use client';

import React from 'react';

interface AdminUserPlansSkeletonProps {
  showHeader?: boolean;
}

const PLAN_ITEMS = [
  { nameW: 'w-36', idW: 'w-28' },
  { nameW: 'w-28', idW: 'w-32' },
];

export function AdminUserPlansSkeleton({
  showHeader = true,
}: AdminUserPlansSkeletonProps) {
  return (
    <div className="space-y-6">
      <section>
        {showHeader && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="h-7 w-32 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="h-4 w-52 bg-[#222] rounded animate-pulse mt-2" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="h-[42px] min-w-[200px] sm:w-[280px] bg-[#202020] border border-white/[0.06] rounded-lg animate-pulse" />
              <div className="h-[42px] w-[110px] rounded-lg bg-[#202020] border border-white/[0.06] shrink-0 animate-pulse" />
            </div>
          </div>
        )}

        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {PLAN_ITEMS.map((plan, i) => (
            <div key={i} className="flex items-center justify-between py-4">
              <div>
                <div className={`h-5 ${plan.nameW} bg-[#2a2a2a] rounded animate-pulse`} />
                <div className={`h-3 ${plan.idW} bg-[#222] rounded font-mono mt-0.5 animate-pulse`} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#202020] px-2 h-[34px]">
                  <div className="w-5 h-4 bg-[#222] rounded animate-pulse" />
                  <div className="w-4 h-4 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="w-5 h-4 bg-[#222] rounded animate-pulse" />
                </div>

                <div className="min-w-[80px] h-[34px] rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminUserPlansSkeleton;
