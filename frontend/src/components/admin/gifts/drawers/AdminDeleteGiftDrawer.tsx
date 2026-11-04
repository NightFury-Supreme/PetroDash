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
  const { deleteGift } = useDeleteAdminGift(() => {
    onSuccess();
    onClose();
  });

  const handleDelete = async () => {
    if (!giftId) return;
    await deleteGift(giftId);
  };

  return (
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
  );
}
