"use client";
import { useTranslations } from 'next-intl';

import { Coins, ShoppingBag } from "lucide-react";
import { getShopIcon, MAX_QUANTITY } from "./shopUtils";

interface ShopItemsViewProps {
  items: any[];
  buying: string | null;
  onBuy: (item: any) => void;
}

export function ShopItemsView({ items, buying, onBuy }: ShopItemsViewProps) {
  const t = useTranslations('Shop');
  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">{t('resources')}</h2>
        <p className="mt-0.5 text-xs text-[#666]">{t('purchaseHelpText')}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
          <ShoppingBag className="mb-3 h-8 w-8 text-white/20" />
          <p className="text-sm text-white/40">{t('noItems')}</p>
        </div>
      ) : (
        <div className="w-full">
          {/* Column headers */}
          <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
            <span>{t('resource')}</span>
            <span>{t('included')}</span>
            <span>{t('price')}</span>
            <span className="text-right">{t('action')}</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {items.map((item) => {
              const Icon = getShopIcon(item.name);
              
              const getTranslatedName = (key: string, defaultName: string) => {
                  switch (key) {
                    case 'allocations': return t('nameAllocations');
                    case 'backups': return t('nameBackups');
                    case 'cpuPercent': return t('nameCpu');
                    case 'databases': return t('nameDatabases');
                    case 'diskMb': return t('nameDisk');
                    case 'memoryMb': return t('nameMemory');
                    case 'serverSlots': return t('nameServerSlots');
                    default: return defaultName;
                  }
                };

                const getDescriptionForKey = (key: string, name: string) => {
                  switch (key) {
                    case 'allocations': return t('descAllocations');
                    case 'backups': return t('descBackups');
                    case 'cpuPercent': return t('descCpu');
                    case 'databases': return t('descDatabases');
                    case 'diskMb': return t('descDisk');
                    case 'memoryMb': return t('descMemory');
                    case 'serverSlots': return t('descServerSlots');
                    default: return t('addExtra', { name });
                  }
                };

              const formatUnit = (unit?: string) => {
                if (!unit || unit === 'count') return '';
                return unit;
              };

              return (
                <div
                  key={item._id || item.key}
                  className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_80px] md:items-center"
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                      <Icon className="h-4 w-4 text-white/50" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{getTranslatedName(item.key, item.name)}</p>
                      <p className="text-xs text-white/30 truncate">{item.description || getDescriptionForKey(item.key, item.name)}</p>
                    </div>
                  </div>

                  {/* Included amount */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-semibold text-white/80">+{item.amountPerUnit}</span>
                    {formatUnit(item.unit) && (
                      <span className="text-xs text-white/30 uppercase tracking-wide">{formatUnit(item.unit)}</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-[#FF5722]" />
                    <span className="text-lg font-semibold text-white/80">{item.pricePerUnit}</span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end mt-2 md:mt-0">
                    <button
                      type="button"
                      disabled={buying === item.key || item.enabled === false}
                      onClick={() => onBuy(item)}
                      className="h-8 w-full md:w-auto rounded-md bg-[#FF5722]/10 px-4 text-xs font-semibold text-[#FF5722] transition-all hover:bg-[#FF5722]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {buying === item.key ? "..." : t("purchase")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-xs text-[#555]">{t('resourcesAddedInstantly')}</p>
        <p className="text-xs text-[#555]">{t('maxUnitsPerPurchase', { max: MAX_QUANTITY })}</p>
      </div>
    </section>
  );
}
