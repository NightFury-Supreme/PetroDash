/* ==========================================================================
   Admin Delete Coupon Drawer
   Compliance: ISO/IEC 25010, SoC (Uses useDeleteCoupon hook)
========================================================================== */

import React from "react";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useTranslations } from "next-intl";
import { useDeleteCoupon } from "@/hooks/admin/coupons";

interface AdminDeleteCouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  couponId: string | null;
  couponCode: string | null;
}

export function AdminDeleteCouponDrawer({
  isOpen,
  onClose,
  onSuccess,
  couponId,
  couponCode,
}: AdminDeleteCouponDrawerProps) {
  const t = useTranslations('Admin.coupons');
  const tCommon = useTranslations('Common');
  const { deleteCoupon, error } = useDeleteCoupon(() => {
    onSuccess();
    onClose();
  });

  const handleDelete = async () => {
    if (!couponId) return;
    const ok = await deleteCoupon(couponId);
    if (!ok) {
      throw new Error(error || t('deleteCoupon'));
    }
  };

  return (
    <>
      <DeleteDrawer
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        entityType={t('couponEntityType')}
        entityName={couponCode || tCommon('unknown')}
        entitySubText={t('deleteCouponSubText')}
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
        ]}
        requireConfirmText={true}
      />
      {error && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-red-500/90 text-white text-sm shadow-xl border border-red-400">
          {error}
        </div>
      )}
    </>
  );
}
