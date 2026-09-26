/* ==========================================================================
   Admin Delete Gift Drawer
   Compliance: ISO/IEC 25010, SoC (Uses useDeleteAdminGift hook)
========================================================================== */

import React from "react";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useTranslations } from "next-intl";
import { useDeleteAdminGift } from "@/hooks/admin/gift";

interface AdminDeleteGiftDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  giftId: string | null;
  giftCode: string | null;
}

export function AdminDeleteGiftDrawer({
  isOpen,
  onClose,
  onSuccess,
  giftId,
  giftCode,
}: AdminDeleteGiftDrawerProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');
  const { deleteGift, error } = useDeleteAdminGift(() => {
    onSuccess();
    onClose();
  });

  const handleDelete = async () => {
    if (!giftId) return;
    const ok = await deleteGift(giftId);
    if (!ok) {
      throw new Error(error || t('deleteGift'));
    }
  };

  return (
    <>
      <DeleteDrawer
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        entityType={t('giftEntityType')}
        entityName={giftCode || tCommon('unknown')}
        entitySubText={t('deleteGiftSubText')}
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
