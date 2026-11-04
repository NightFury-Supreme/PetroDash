"use client";

import { Settings, Coins, ShoppingCart } from 'lucide-react';
import { RowActionButton, StatusIndicator } from '@/components/ui';
import { ShopItem } from '@/hooks/admin/shop/useAdminShop';
import { useTranslations } from 'next-intl';
import { getLocalizedItemName, getLocalizedItemDescription, getShopIcon } from '@/components/shop/shopUtils';

interface ShopItemsListProps {
  items: ShopItem[];
  onStartEditing: (item: ShopItem) => void;
}

export function ShopItemsList({
  items,
  onStartEditing,
}: ShopItemsListProps) {
  const t = useTranslations('AdminShop');
  const tShop = useTranslations('Shop');
  const tCommon = useTranslations('Common');

  const formatUnit = (unit?: string) => {
    if (!unit) return '';
    if (unit === 'MB') return 'MB';
    if (unit === '%') return '%';
    if (unit === 'count') return '';
    return unit;
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingCart size={28} className="mb-3 text-white/20" />
        <p className="text-sm text-white/40">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>{tCommon('resource')}</span>
        <span>{t('amount')}</span>
        <span>{tCommon('price')}</span>
        <span>{t('max')}</span>
        <span>{tCommon('status')}</span>
        <span className="text-right">{tCommon('action')}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {items.map((item) => {
          const Icon = getShopIcon(item.key || item.name);
          const itemName = getLocalizedItemName(item.key, item.name, tShop);
          const itemDesc = getLocalizedItemDescription(item.key, item.name, tShop);
          return (
            <div
              key={item.id || item.key}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] md:items-center"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-white/50">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">
                    {itemName}
                  </p>
                  <p className="text-xs text-white/30 truncate">{itemDesc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-normal text-white/80">+{item.amountPerUnit}</span>
                {formatUnit(item.unit) && (
                  <span className="text-xs text-white/30 uppercase tracking-wide">{formatUnit(item.unit)}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Coins size={14} strokeWidth={1.5} className="text-white" />
                <span className="text-sm font-normal text-white/80">{item.pricePerUnit}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-normal text-white/80">{item.maxPerPurchase}</span>
              </div>

              <div className="flex items-center">
                <StatusIndicator
                  status={item.enabled ? 'enabled' : 'disabled'}
                  label={item.enabled ? tCommon('enabled') : tCommon('disabled')}
                  size="sm"
                  className="uppercase tracking-wide"
                />
              </div>

              <div className="flex justify-end mt-2 md:mt-0">
                <RowActionButton
                  variant="default"
                  onClick={() => onStartEditing(item)}
                  title={tCommon('manage')}
                >
                  <Settings size={15} />
                </RowActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
