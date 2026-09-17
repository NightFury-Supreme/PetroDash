"use client";

import React from 'react';
import { usePathname } from '@/i18n/routing';
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton';
import ShopSkeleton from '../shop/ShopSkeleton';
import ProfileSkeleton from '../profile/ProfileSkeleton';
import TicketsSkeleton from '../tickets/TicketsSkeleton';
import ReferralsSkeleton from '../referrals/ReferralsSkeleton';
import { EarnSkeleton } from '../earn/EarnSkeleton';
import { SidebarSkeleton } from './SidebarSkeleton';

// Full page skeleton with sidebar that dynamically routes based on pathname
export function FullPageSkeleton() {
  const pathname = usePathname() || "";
  
  let InnerSkeleton = <DashboardSkeleton />;
  
  if (pathname.includes('/shop')) {
    InnerSkeleton = <ShopSkeleton />;
  } else if (pathname.includes('/profile')) {
    InnerSkeleton = <ProfileSkeleton />;
  } else if (pathname.includes('/tickets')) {
    InnerSkeleton = <TicketsSkeleton />;
  } else if (pathname.includes('/referrals')) {
    InnerSkeleton = <ReferralsSkeleton />;
  } else if (pathname.includes('/earn')) {
    InnerSkeleton = <EarnSkeleton />;
  }
  
  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      <SidebarSkeleton />

      {/* Main content wrapper with margin matching sidebar width */}
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {InnerSkeleton}
        </main>
      </div>
    </div>
  );
}