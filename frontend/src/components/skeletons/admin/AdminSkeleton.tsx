import React from 'react';
import {
  OverviewTabSkeleton,
  UsersTabSkeleton,
  InfrastructureTabSkeleton,
  RevenueTabSkeleton,
  SupportTabSkeleton,
} from './dashboard';

export type DashboardTab = 'overview' | 'users' | 'infrastructure' | 'revenue' | 'support';

export interface AdminSkeletonProps {
  tab?: DashboardTab;
}

const TAB_KEYS: DashboardTab[] = ['overview', 'users', 'infrastructure', 'revenue', 'support'];

export function AdminSkeleton({ tab = 'overview' }: AdminSkeletonProps) {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-7 w-48 bg-[#2a2a2a] rounded animate-pulse mb-1.5" />
              <div className="h-4 w-72 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="w-24">
              <div className="w-full h-9 bg-[#202020] border border-white/[0.06] rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <div className="h-[14px] w-[70px] bg-[#222] rounded animate-pulse" />
              </div>
              <nav className="space-y-1">
                {TAB_KEYS.map((key) => {
                  const isActive = tab === key;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg ${
                        isActive ? 'bg-[#202020]' : 'bg-transparent'
                      }`}
                    >
                      <div
                        className={`w-[17px] h-[17px] rounded animate-pulse shrink-0 ${
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
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <main>
              {tab === 'overview' && <OverviewTabSkeleton />}
              {tab === 'users' && <UsersTabSkeleton />}
              {tab === 'infrastructure' && <InfrastructureTabSkeleton />}
              {tab === 'revenue' && <RevenueTabSkeleton />}
              {tab === 'support' && <SupportTabSkeleton />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSkeleton;
