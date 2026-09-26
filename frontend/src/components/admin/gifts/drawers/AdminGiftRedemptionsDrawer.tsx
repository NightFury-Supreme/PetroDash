/* ==========================================================================
   Admin Gift Redemptions Drawer
   Compliance: ISO/IEC 25010, SoC (Uses useGiftRedemptions hook)
========================================================================== */

import React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { AdminGiftRedemptionsSkeleton } from "@/components/skeletons/admin/gifts";
import { Users, User } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useGiftRedemptions } from "@/hooks/admin/gift";

interface AdminGiftRedemptionsDrawerProps {
  giftId: string | null;
  onClose: () => void;
}

export function AdminGiftRedemptionsDrawer({
  giftId,
  onClose,
}: AdminGiftRedemptionsDrawerProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');

  const {
    redemptions,
    giftCode,
    loading,
    error,
    currentPage,
    setCurrentPage,
    pagination,
  } = useGiftRedemptions(giftId);

  return (
    <Drawer
      isOpen={!!giftId}
      onClose={onClose}
      title={t('giftRedemptions')}
      subtitle={giftCode ? t('viewingRedemptions', { code: giftCode }) : tCommon('loading')}
      icon={<Users size={20} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-[#161616] px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#1A1A1A] hover:text-[#D4D4D4]"
          >
            {tCommon('close')}
          </button>
        </div>
      }
    >
      {loading && redemptions.length === 0 ? (
        <AdminGiftRedemptionsSkeleton />
      ) : error ? (
        <div className="p-3 m-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : redemptions.length === 0 ? (
        <div className="text-center py-12 text-[#666] text-sm">
          {t('noRedemptions')}
        </div>
      ) : (
        <div className="-mx-6 sm:-mx-8">
          {/* Table Header */}
          <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr] border-b border-white/[0.06] px-6 sm:px-8 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid pt-4">
            <span>{tCommon('username')}</span>
            <span>{tCommon('email')}</span>
            <span className="text-right">{t('redeemedAt')}</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.06]">
            {redemptions.map((r, i) => (
              <div
                key={i}
                className="group grid grid-cols-1 gap-4 px-6 sm:px-8 py-4 transition hover:bg-white/[0.015] md:grid-cols-[1.5fr_1.5fr_1fr] md:items-center"
              >
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{tCommon('username')}</p>
                  <Link
                    href={r.user?._id ? `/admin/users/${r.user._id}` : "#"}
                    className={`flex items-center gap-2 group/user ${r.user?._id ? "cursor-pointer" : "cursor-default pointer-events-none"}`}
                  >
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
                      {r.user?.profilePicture ? (
                        <img src={r.user.profilePicture} alt={tCommon('avatar')} className="w-full h-full object-cover" />
                      ) : (
                        <User size={12} className="text-[#888]" />
                      )}
                    </div>
                    <div>
                      <span className={`block truncate text-sm text-[#DDDDDD] ${r.user?._id ? "group-hover/user:text-[#FF5722] transition-colors" : ""}`}>
                        {r.user?.username || tCommon('unknown')}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
                        {r.user?._id || tCommon('unknown')}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{tCommon('email')}</p>
                  <span className="block truncate text-sm text-[#888888]">
                    {r.user?.email || "—"}
                  </span>
                </div>

                <div className="min-w-0 md:text-right">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">{t('redeemedAt')}</p>
                  <span className="text-xs text-[#666]">
                    {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-white/[0.06]">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={10}
                onPageChange={setCurrentPage}
                loading={loading}
                itemName={t('giftRedemptions')}
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
