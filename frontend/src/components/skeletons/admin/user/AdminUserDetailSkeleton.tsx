'use client';

import React from 'react';
import {
  AdminUserOverviewSkeleton,
  AdminUserResourcesSkeleton,
  AdminUserServersSkeleton,
  AdminUserPlansSkeleton,
  AdminUserReferralsSkeleton,
  AdminUserInvoicesSkeleton,
  AdminUserActivitySkeleton,
  AdminUserSecuritySkeleton,
  AdminUserSessionsSkeleton,
} from './tabs';

const SECTIONS = [
  'overview',
  'resources',
  'servers',
  'plans',
  'referrals',
  'invoices',
  'activity',
  'security',
  'sessions',
] as const;

export type UserDetailSkeletonSection = (typeof SECTIONS)[number] | string;

interface AdminUserDetailSkeletonProps {
  section?: UserDetailSkeletonSection;
}

export function AdminUserDetailSkeleton({
  section = 'overview',
}: AdminUserDetailSkeletonProps) {
  const activeIndex = SECTIONS.indexOf(section as (typeof SECTIONS)[number]);
  const resolvedIndex = activeIndex !== -1 ? activeIndex : 0;

  return (
    <div className="flex flex-col h-full space-y-6">
      <header>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 w-48 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-72 bg-[#202020] rounded animate-pulse mt-1" />
          </div>
        </div>
      </header>

      <section className="border-b border-white/[0.06] pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-white/[0.06] bg-[#222] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-32 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-[#222] animate-pulse" />
              </div>
              <div className="h-4 w-44 rounded bg-[#202020] animate-pulse mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full bg-[#222] animate-pulse" />
              <div>
                <div className="h-2.5 w-14 bg-[#202020] rounded animate-pulse" />
                <div className="h-4 w-20 bg-[#2a2a2a] rounded animate-pulse mt-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-48 shrink-0 pt-1 flex flex-col min-h-[calc(100vh-12rem)]">
          <div className="sticky top-6 flex-1 flex flex-col">
            <div>
              <div className="mb-4">
                <div className="h-3 w-28 bg-[#202020] rounded animate-pulse" />
              </div>

              <nav className="space-y-1">
                {SECTIONS.map((sec, i) => {
                  const isActive = i === resolvedIndex;
                  return (
                    <div
                      key={sec}
                      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 ${
                        isActive ? 'bg-[#202020]' : ''
                      }`}
                    >
                      <div
                        className={`h-[17px] w-[17px] shrink-0 rounded animate-pulse ${
                          isActive ? 'bg-[#2a2a2a]' : 'bg-[#222]'
                        }`}
                      />
                      <div
                        className={`h-4 w-24 rounded animate-pulse ${
                          isActive ? 'bg-[#2a2a2a]' : 'bg-[#222]'
                        }`}
                      />
                    </div>
                  );
                })}
              </nav>

              <div className="mt-8 border-t border-white/[0.06] pt-6 mb-4">
                <div className="h-3 w-24 bg-[#202020] rounded animate-pulse" />
              </div>

              <nav className="space-y-1">
                <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
                  <div className="h-[17px] w-[17px] shrink-0 rounded bg-[#222] animate-pulse" />
                  <div className="h-4 w-20 rounded bg-[#222] animate-pulse" />
                </div>
                <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
                  <div className="h-[17px] w-[17px] shrink-0 rounded bg-[#222] animate-pulse" />
                  <div className="h-4 w-24 rounded bg-[#222] animate-pulse" />
                </div>
              </nav>
            </div>
          </div>
        </aside>

        <div className="flex-1 w-full min-w-0">
          {section === 'resources' && <AdminUserResourcesSkeleton />}
          {section === 'servers' && <AdminUserServersSkeleton />}
          {section === 'plans' && <AdminUserPlansSkeleton />}
          {section === 'referrals' && <AdminUserReferralsSkeleton />}
          {section === 'invoices' && <AdminUserInvoicesSkeleton />}
          {section === 'activity' && <AdminUserActivitySkeleton />}
          {section === 'security' && <AdminUserSecuritySkeleton />}
          {section === 'sessions' && <AdminUserSessionsSkeleton />}
          {(section === 'overview' || !section || activeIndex === -1) && (
            <AdminUserOverviewSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailSkeleton;
