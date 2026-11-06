"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminStoreCouponsSkeleton } from "@/components/skeletons/admin/store";
import { useCouponsList } from "@/hooks/admin/coupons";
import { CouponsHeader } from "./CouponsHeader";
import { CouponsList } from "./CouponsList";
import { AdminCouponFilters } from "./AdminCouponFilters";
import { AdminCreateCouponDrawer } from "./drawers/AdminCreateCouponDrawer";
import { AdminEditCouponDrawer } from "./drawers/AdminEditCouponDrawer";
import { AdminDeleteCouponDrawer } from "./drawers/AdminDeleteCouponDrawer";
import type { AdminCouponItem } from "./types";

export function CouponsPageContent() {
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<AdminCouponItem | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<AdminCouponItem | null>(null);

  const {
    coupons,
    plans,
    currency,
    page,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    handlePageChange,
    refetch,
    refresh,
  } = useCouponsList();

  if (loading && coupons.length === 0 && !searchQuery && statusFilter === 'all' && typeFilter === 'all') {
    return <AdminStoreCouponsSkeleton />;
  }

  const startItem = pagination.total === 0 ? 0 : (page - 1) * 10 + 1;
  const endItem = Math.min(page * 10, pagination.total);

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {tErrorBackend.has(error) ? tErrorBackend(error) : error}
        </div>
      )}

      <CouponsHeader onCreateNew={() => setIsCreateOpen(true)} />

      <AdminCouponFilters
        status={statusFilter}
        type={typeFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sort={sort}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
        onSortChange={setSort}
        onFilter={refresh}
        loading={loading}
      />

      <CouponsList
        coupons={coupons}
        currency={currency}
        onManage={(coupon) => setSelectedForEdit(coupon)}
        onDeleteClick={(coupon) => setSelectedForDelete(coupon)}
      />

      {pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
          <p className="text-[11px] text-white/20">
            {tCommon('showing')} {startItem} - {endItem} {tCommon('of')} {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('previousPage')}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center px-2">
              <span className="text-xs font-medium text-white/40">
                {page} <span className="text-white/20 mx-1">/</span> {pagination.totalPages}
              </span>
            </div>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={tCommon('nextPage')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <AdminCreateCouponDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => refetch()}
        plans={plans}
        currency={currency}
      />

      <AdminEditCouponDrawer
        coupon={selectedForEdit}
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={() => refetch()}
        onDeleteClick={(coupon) => {
          setSelectedForEdit(null);
          setSelectedForDelete(coupon);
        }}
        plans={plans}
        currency={currency}
      />

      <AdminDeleteCouponDrawer
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        onSuccess={() => refetch()}
        couponId={selectedForDelete?.id || null}
        couponCode={selectedForDelete?.code || null}
      />
    </div>
  );
}

export default CouponsPageContent;
