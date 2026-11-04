"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { ReferralRow } from "../ReferralRow";
import type { ReferralUser } from "../types";

interface ReferredUsersTableProps {
  readonly users: ReferralUser[];
  readonly loading: boolean;
  readonly page: number;
  readonly totalUsers: number;
  readonly totalPages: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

import { ReferredUsersTableSkeleton } from "@/components/skeletons/referrals";

export function ReferredUsersTable({
  users,
  loading,
  page,
  totalUsers,
  totalPages,
  pageSize,
  onPageChange,
}: ReferredUsersTableProps) {
  const t = useTranslations("Referrals");
  const tCommon = useTranslations('Common');

  return (
    <section aria-label={t("referredUsers")}>
      <div className="mb-5 flex items-end justify-between border-t border-white/[0.07] pt-7">
        <div>
          <h2 className="text-base font-semibold">{t("referredUsers")}</h2>
          <p className="mt-1 text-xs text-white/25">{t("referredUsersSubtitle")}</p>
        </div>
      </div>

      <div
        role="row"
        className="hidden grid-cols-[minmax(300px,1fr)_180px_140px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid"
      >
        <span role="columnheader">{tCommon('user')}</span>
        <span role="columnheader">{t("tableJoined")}</span>
        <span role="columnheader" className="text-right">{tCommon('status')}</span>
      </div>

      <div
        role="rowgroup"
        className="divide-y divide-white/[0.06]"
        aria-live="polite"
        aria-busy={loading}
      >
        {loading ? (
          <ReferredUsersTableSkeleton />
        ) : users.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <Users className="w-8 h-8 text-white/10 mb-3" aria-hidden="true" />
            <p className="text-white/40 text-sm">{t("noReferrals")}</p>
            <p className="text-white/20 text-xs mt-1">{t("noReferralsHint")}</p>
          </div>
        ) : (
          users.map((user, index) => (
            <ReferralRow key={`${user.email}-${index}`} user={user} />
          ))
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalUsers}
        pageSize={pageSize}
        onPageChange={onPageChange}
        loading={loading}
        itemName={t("suffixUsers")}
      />
    </section>
  );
}
