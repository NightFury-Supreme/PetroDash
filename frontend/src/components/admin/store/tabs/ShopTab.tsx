'use client';

import { useState } from 'react';
import { useAdminShop, type ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { AdminStoreShopSkeleton } from '@/components/skeletons/admin/store';
import { AdminShopError } from '@/components/admin/shop/AdminShopError';
import { AdminShopContent } from '@/components/admin/shop/AdminShopContent';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export default function AdminShopTab() {
  const t = useTranslations('AdminShop');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();
  const {
    items,
    loading,
    error,
    saving,
    updateItem,
  } = useAdminShop();

  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleStartEditing = (item: ShopItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (itemId: string, updates: Partial<ShopItem>) => {
    try {
      await updateItem(itemId, updates);
      showSuccess(t('success.itemUpdated'));
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : '';
      showError(
        errKey
          ? (tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey)
          : t('errors.failedToUpdate')
      );
    }
  };

  if (loading) {
    return <AdminStoreShopSkeleton />;
  }

  return (
    <div className="space-y-6">
      <AdminShopError error={error} />
      <AdminShopContent
        items={items}
        editingItem={editingItem}
        isDrawerOpen={isDrawerOpen}
        saving={saving}
        onStartEditing={handleStartEditing}
        onCloseDrawer={handleCloseDrawer}
        onSaveItem={handleSaveItem}
      />
    </div>
  );
}
