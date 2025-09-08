import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { ShopNotice } from './ShopNotice';
import { ShopItemsList } from './ShopItemsList';
import { EditShopItemModal } from './EditShopItemModal';

interface AdminShopContentProps {
  items: ShopItem[];
  editingItem: ShopItem | null;
  isModalOpen: boolean;
  saving: boolean;
  onStartEditing: (item: ShopItem) => void;
  onCloseModal: () => void;
  onSaveItem: (itemId: string, updates: Partial<ShopItem>) => Promise<void>;
  onToggleEnabled: (item: ShopItem) => Promise<void>;
}

export function AdminShopContent({
  items,
  editingItem,
  isModalOpen,
  saving,
  onStartEditing,
  onCloseModal,
  onSaveItem,
  onToggleEnabled,
}: AdminShopContentProps) {
  return (
    <>
      {/* Notice */}
      <ShopNotice />

      {/* Shop Items List */}
      <ShopItemsList
        items={items}
        onStartEditing={onStartEditing}
        onToggleEnabled={onToggleEnabled}
      />

      {/* Edit Modal */}
      <EditShopItemModal
        item={editingItem}
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSave={onSaveItem}
        saving={saving}
      />
    </>
  );
}



