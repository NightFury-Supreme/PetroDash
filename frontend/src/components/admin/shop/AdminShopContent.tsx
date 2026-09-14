import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
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
      <div className="mb-4 mt-8">
        <h2 className="text-lg font-semibold text-white">Shop Items</h2>
        <p className="mt-0.5 text-xs text-[#666]">Manage preset shop items, adjust pricing, and toggle availability.</p>
      </div>

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



