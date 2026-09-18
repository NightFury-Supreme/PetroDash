"use client";

import React from 'react';
import { usePathname } from '@/i18n/routing';
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton';
import ShopSkeleton from '../shop/ShopSkeleton';
import ProfileSkeleton from '../profile/ProfileSkeleton';
import TicketsSkeleton from '../tickets/TicketsSkeleton';
import ReferralsSkeleton from '../referrals/ReferralsSkeleton';
import { EarnSkeleton } from '../earn/EarnSkeleton';
import { AdminSkeleton } from '../admin/AdminSkeleton';
import { GiftSkeleton } from '../gift/GiftSkeleton';
import { PanelSkeleton } from '../panel/PanelSkeleton';

// Returns just the content skeleton based on route (without sidebar wrappers)
export function RouteSkeleton() {
  const pathname = usePathname() || "";
  
  if (pathname.includes('/dashboard')) return <DashboardSkeleton />;
  if (pathname.includes('/shop')) return <ShopSkeleton />;
  if (pathname.includes('/profile')) return <ProfileSkeleton />;
  if (pathname.includes('/tickets')) return <TicketsSkeleton />;
  if (pathname.includes('/referrals')) return <ReferralsSkeleton />;
  if (pathname.includes('/earn')) return <EarnSkeleton />;
  if (pathname.includes('/admin')) return <AdminSkeleton />;
  if (pathname.includes('/gift')) return <GiftSkeleton />;
  if (pathname.includes('/panel')) return <PanelSkeleton />;
  
  return null;
}
