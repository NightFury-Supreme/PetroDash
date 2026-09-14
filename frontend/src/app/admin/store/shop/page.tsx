"use client";

import { useState } from 'react';
import { useAdminShop } from '@/hooks/admin/shop/useAdminShop';
import { AdminShopSkeleton } from '@/components/skeletons/admin/shop/AdminShopSkeleton';
import { AdminShopError } from '@/components/admin/shop/AdminShopError';
import { AdminShopContent } from '@/components/admin/shop/AdminShopContent';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';

export default function AdminShopPage() {
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
    await updateItem(itemId, updates);
  };

  const handleToggleEnabled = async (item: ShopItem) => {
    await updateItem(item._id, { enabled: !item.enabled });
  };

  if (loading) {
    return (
      
        <AdminShopSkeleton />
      
    );
  }

  return (
      <div className="p-4 sm:p-6 space-y-6">
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
          onToggleEnabled={handleToggleEnabled}
        />
      </div>
  );
}


