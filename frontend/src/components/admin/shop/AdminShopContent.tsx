import { useState, useMemo } from 'react';
import { Search, X, Inbox } from 'lucide-react';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { ShopItemsList } from './ShopItemsList';
import { EditShopItemDrawer } from './EditShopItemDrawer';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminShopContentProps {
  items: ShopItem[];
  editingItem: ShopItem | null;
  isDrawerOpen: boolean;
  saving: boolean;
  onStartEditing: (item: ShopItem) => void;
  onCloseDrawer: () => void;
  onSaveItem: (itemId: string, updates: Partial<ShopItem>) => Promise<void>;
}

export function AdminShopContent({
  items,
  editingItem,
  isDrawerOpen,
  saving,
  onStartEditing,
  onCloseDrawer,
  onSaveItem,
}: AdminShopContentProps) {
  const t = useTranslations('AdminShop');
  const tCommon = useTranslations('Common');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('name');

  const statusOptions = [
    { value: 'all', label: t('allStatuses') },
    { value: 'enabled', label: t('statusEnabled') },
    { value: 'disabled', label: t('statusDisabled') },
  ];

  const sortOptions = [
    { value: 'name', label: t('sortNameAsc') },
    { value: 'price_asc', label: t('sortPriceAsc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
  ];

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (statusFilter !== 'all') {
      result = result.filter((item) => (statusFilter === 'enabled' ? item.enabled : !item.enabled));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price_asc') return a.pricePerUnit - b.pricePerUnit;
      if (sort === 'price_desc') return b.pricePerUnit - a.pricePerUnit;
      return 0;
    });

    return result;
  }, [items, searchQuery, statusFilter, sort]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-white/[0.07] bg-white/[0.02] pl-10 pr-4 text-xs text-white placeholder-white/20 transition-all focus:border-[#FF5722]/50 focus:bg-[#FF5722]/[0.02] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[140px]">
            <SelectDropdown
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              className="w-full"
              buttonClassName="h-10 text-xs bg-[#121212] border border-white/[0.07] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] transition-colors"
            />
          </div>

          <div className="w-[150px]">
            <SelectDropdown
              value={sort}
              options={sortOptions}
              onChange={setSort}
              className="w-full"
              buttonClassName="h-10 text-xs bg-[#121212] border border-white/[0.07] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] transition-colors"
            />
          </div>
        </div>
      </div>

      {(searchQuery.trim() || statusFilter !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-white/30">{tCommon('activeFilters')}:</span>
          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/60">
              {tCommon('search')}: {searchQuery.trim()}
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-white/30 hover:text-white"
                aria-label={tCommon('removeFilter')}
              >
                <X size={10} />
              </button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-white/60">
              {tCommon('status')}: {statusOptions.find((o) => o.value === statusFilter)?.label}
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="text-white/30 hover:text-white"
                aria-label={tCommon('removeFilter')}
              >
                <X size={10} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-[11px] text-[#FF5722] hover:underline"
          >
            {tCommon('clearAll')}
          </button>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-16 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.03] text-white/30">
            <Inbox size={24} />
          </div>
          <p className="text-sm text-white/40">{t('noItems')}</p>
        </div>
      ) : (
        <ShopItemsList items={filteredItems} onStartEditing={onStartEditing} />
      )}

      <EditShopItemDrawer
        item={editingItem}
        isOpen={isDrawerOpen}
        onClose={onCloseDrawer}
        onSave={onSaveItem}
        saving={saving}
      />
    </>
  );
}

export default AdminShopContent;
