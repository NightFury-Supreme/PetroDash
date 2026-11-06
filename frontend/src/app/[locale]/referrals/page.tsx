"use client";

import { ReferralsSkeleton } from "@/components/skeletons/referrals";
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

  if (!stats || statsLoading) {
    return <ReferralsSkeleton />;
  }

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
