"use client";

import { Settings } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
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
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
        <i className="fas fa-shopping-cart mb-3 text-2xl text-white/20"></i>
        <p className="text-sm text-white/40">{t('noItems')}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Column headers */}
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
              key={item._id || item.key}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] md:items-center"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                  <Icon className="h-4 w-4 text-white/50" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">
                    {itemName}
                  </p>
                  <p className="text-xs text-white/30 truncate">{itemDesc}</p>
                </div>
              </div>

            {/* Included amount */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white/80">+{item.amountPerUnit}</span>
              {formatUnit(item.unit) && (
                <span className="text-xs text-white/30 uppercase tracking-wide">{formatUnit(item.unit)}</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-1.5">
              <i className="fas fa-coins text-[11px] text-[#FF5722]"></i>
              <span className="text-sm font-semibold text-white/80">{item.pricePerUnit}</span>
            </div>

            {/* Max */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white/80">{item.maxPerPurchase}</span>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <div className="relative inline-flex items-center">
                {item.enabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">{tCommon('enabled')}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">{tCommon('disabled')}</span>
                )}
              </div>
            </div>

            {/* Action */}
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
        ); })}
      </div>
    </div>
  );
}

