/* ==========================================================================
   User Detail Profile Banner Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<120 lines)
========================================================================== */

"use client";

import React from "react";
import { User, Coins, Gavel, Check } from "lucide-react";
import { RankBadge } from "@/components/ui";
import { useTranslations } from "next-intl";

export interface UserDetailProfileBannerProps {
  user: {
    username?: string;
    email?: string;
    role?: string;
    profilePicture?: string;
    coins?: number;
    emailVerified?: boolean;
  };
  isBanned?: boolean;
}

export function UserDetailProfileBanner({ user, isBanned }: UserDetailProfileBannerProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');

  return (
    <section className="border-b border-white/[0.06] pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222]">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={tCommon('avatar')}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#888]">
                  <User size={24} />
                </div>
              )}
            </div>
            {isBanned && (
              <span
                title={t('banned')}
                className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161616] bg-red-500 shadow-md"
              >
                <Gavel size={11} strokeWidth={2.5} className="text-white" />
              </span>
            )}
            {!isBanned && user.emailVerified && (
              <span
                title={tCommon('verified')}
                className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#161616] bg-emerald-500 shadow-md"
              >
                <Check size={11} strokeWidth={3} className="text-white" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-white">
                {user.username || tCommon('username')}
              </h2>
              <RankBadge rank={user.role || 'user'} />
            </div>
            <p className="text-sm text-[#888]">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <Coins size={16} strokeWidth={1.5} className="text-white" />
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-[#666]">
                {tCommon('balance')}
              </span>
              <span className="text-sm font-normal text-[#D4D4D4]">
                {user.coins || 0} {tCommon('coins')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserDetailProfileBanner;
