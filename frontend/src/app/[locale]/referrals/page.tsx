/* ==========================================================================
   /referrals — Page Orchestrator
   This file is intentionally thin: it wires hooks to components only.
   All business logic lives in hooks; all UI lives in components.
   ISO/IEC 25010 §4.1: Modularity — change impact isolated per module
========================================================================== */

"use client";

import React from "react";
import ReferralsSkeleton from "@/components/skeletons/referrals/ReferralsSkeleton";
import {
  useReferralStats,
  useReferralUsers,
  useReferralCode,
  ReferralHeader,
  ReferralsSummarySection,
  ReferralLinkCard,
  CustomReferralCode,
  ReferredUsersTable,
} from "@/components/referrals";

export default function ReferralsPage() {
  /* -----------------------------------------------------------------------
     DATA LAYER
  ----------------------------------------------------------------------- */
  const {
    stats,
    loading: statsLoading,
    setStats,
  } = useReferralStats();

  const {
    users,
    loading: usersLoading,
    page,
    totalUsers,
    totalPages,
    pageSize,
    setPage,
  } = useReferralUsers();

  /* -----------------------------------------------------------------------
     INTERACTION LAYER — code is wired to stats so it can update link in place
  ----------------------------------------------------------------------- */
  const {
    copied,
    editingCode,
    draftCode,
    saveStatus,
    handleCopy,
    startEditing,
    cancelEditing,
    setDraftCode,
    saveCode,
  } = useReferralCode({
    initialCode: stats?.code ?? "",
    initialLink: stats?.link ?? "",
    onCodeUpdated: (newCode, newLink) => {
      if (stats) {
        setStats({ ...stats, code: newCode, link: newLink });
      }
    },
  });

  /* -----------------------------------------------------------------------
     LOADING GUARD — show full-page skeleton while initial stats load
  ----------------------------------------------------------------------- */
  if (statsLoading || !stats) {
    return <ReferralsSkeleton />;
  }

  /* -----------------------------------------------------------------------
     RENDER
  ----------------------------------------------------------------------- */
  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] min-h-screen text-white">
      <div className="flex flex-col h-full space-y-6">

        <ReferralHeader referrerCoins={stats.referrerCoins} />

        <ReferralsSummarySection
          totalUsers={totalUsers}
          totalCoins={stats.coinsEarned}
          successfulReferrals={stats.referredCount}
        />

        <ReferralLinkCard
          link={stats.link}
          copied={copied}
          onCopy={() => handleCopy(stats.link)}
        />

        <CustomReferralCode
          unlocked={stats.canCustomize}
          threshold={stats.minInvites}
          editingCode={editingCode}
          draftCode={draftCode}
          saveStatus={saveStatus}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onChangeDraftCode={setDraftCode}
          onSaveCode={saveCode}
        />

        <ReferredUsersTable
          users={users}
          loading={usersLoading}
          page={page}
          totalUsers={totalUsers}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
        />

      </div>
    </div>
  );
}
