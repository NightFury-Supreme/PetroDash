"use client";

import { useState } from 'react';
import { useAdminShop } from '@/hooks/admin/shop/useAdminShop';
import { AdminShopSkeleton } from '@/components/skeletons/admin/shop/AdminShopSkeleton';
import { AdminShopError } from '@/components/admin/shop/AdminShopError';
import { AdminShopContent } from '@/components/admin/shop/AdminShopContent';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { useToast } from '@/components/ui/ToastProvider';

export default function AdminShopTab() {
  const { showSuccess, showError } = useToast();
  const {
    items,
    loading,
    error,
    saving,
    updateItem,
  } = useAdminShop();

  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartEditing = (item: ShopItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = async (itemId: string, updates: Partial<ShopItem>) => {
    try {
      await updateItem(itemId, updates);
      showSuccess("Item updated successfully");
    } catch (err: any) {
      showError(err?.message || "Failed to update item");
    }
  };

  if (loading) {
    return (
      
        <AdminShopSkeleton />
      
    );
  }

  return (
      <div className="space-y-6">
        {/* Error Display */}
        <AdminShopError error={error} />

        {/* Main Content */}
        <AdminShopContent
          items={items}
          editingItem={editingItem}
          isModalOpen={isModalOpen}
          saving={saving}
          onStartEditing={handleStartEditing}
          onCloseModal={handleCloseModal}
          onSaveItem={handleSaveItem}
        />
      </div>
  );
}


