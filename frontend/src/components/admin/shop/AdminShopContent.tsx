import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { ShopItemsList } from './ShopItemsList';
import { EditShopItemModal } from './EditShopItemModal';
import { useTranslations } from 'next-intl';

interface AdminShopContentProps {
  items: ShopItem[];
  editingItem: ShopItem | null;
  isModalOpen: boolean;
  saving: boolean;
  onStartEditing: (item: ShopItem) => void;
  onCloseModal: () => void;
  onSaveItem: (itemId: string, updates: Partial<ShopItem>) => Promise<void>;
}

export function AdminShopContent({
  items,
  editingItem,
  isModalOpen,
  saving,
  onStartEditing,
  onCloseModal,
  onSaveItem,
}: AdminShopContentProps) {
  const t = useTranslations('AdminShop');

  return (
    <>
      <div className="mb-4 mt-8">
        <h2 className="text-lg font-semibold text-white">{t('shopItems')}</h2>
        <p className="mt-0.5 text-xs text-[#666]">{t('shopItemsDescription')}</p>
      </div>

      {/* Shop Items List */}
      <ShopItemsList
        items={items}
        onStartEditing={onStartEditing}
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



