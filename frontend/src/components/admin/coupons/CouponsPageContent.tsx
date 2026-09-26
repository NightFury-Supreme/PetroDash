/* ==========================================================================
   Admin Coupons Page Content
   Compliance: ISO/IEC 25010, SoC (Decoupled Hooks), Clean Architecture
========================================================================== */

"use client";

import React, { useState } from "react";
import { AdminCouponsSkeleton } from "@/components/skeletons/admin/coupons/AdminCouponsSkeleton";
import { Pagination } from "@/components/Pagination";
import { useCouponsList } from "@/hooks/admin/coupons";
import { CouponsHeader } from "./CouponsHeader";
import { CouponsList } from "./CouponsList";
import { AdminCreateCouponDrawer } from "./drawers/AdminCreateCouponDrawer";
import { AdminEditCouponDrawer } from "./drawers/AdminEditCouponDrawer";
import { AdminDeleteCouponDrawer } from "./drawers/AdminDeleteCouponDrawer";
import type { AdminCouponItem } from "./types";

export function CouponsPageContent() {
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
    handlePageChange,
    refetch,
  } = useCouponsList();

  if (loading && coupons.length === 0) {
    return <AdminCouponsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <CouponsHeader onCreateNew={() => setIsCreateOpen(true)} />

      <CouponsList
        coupons={coupons}
        currency={currency}
        onManage={(coupon) => setSelectedForEdit(coupon)}
        onDeleteClick={(coupon) => setSelectedForDelete(coupon)}
      />

      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={10}
        onPageChange={handlePageChange}
        itemName="coupons"
      />

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
        couponId={selectedForDelete?._id || null}
        couponCode={selectedForDelete?.code || null}
      />
    </div>
  );
}

export default CouponsPageContent;
