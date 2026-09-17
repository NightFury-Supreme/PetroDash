"use client";

import { useState } from "react";
import { Coins, Minus, Plus, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslations } from "next-intl";
import { getShopIcon, getTotalAmount, MAX_QUANTITY, SummaryRow } from "./shopUtils";

interface PurchaseDrawerProps {
  item: any | null;
  quantity: number;
  total: number;
  buying: boolean;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onQuantityChange: (v: number) => void;
  onConfirm: () => Promise<boolean>;
  
}

function CheckoutSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500">
      {children}
    </h2>
  );
}

export function PurchaseDrawer({
  item,
  quantity,
  total,
  buying,
  onClose,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onConfirm,
  
}: PurchaseDrawerProps) {
  const t = useTranslations('Shop');
    // Track last item so the drawer doesn't instantly empty out during slide-out animation
  const [lastItem, setLastItem] = useState<any | null>(null);
  
  if (item && item !== lastItem) {
    setLastItem(item);
  }
  
  const displayItem = item || lastItem;

  const maxQty = displayItem ? displayItem.maxPerPurchase || MAX_QUANTITY : MAX_QUANTITY;
  const Icon = displayItem ? getShopIcon(displayItem.name) : null;

  return (
    <Drawer
      isOpen={!!item}
      onClose={onClose}
      title="Checkout"
      subtitle="Complete your purchase"
      icon={<Coins className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={async () => {
              const success = await onConfirm();
              if (success) {
                onClose();
              }
            }}
            disabled={buying || !displayItem}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                buying || !displayItem
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] text-white hover:bg-[#E64D1F] border border-transparent"
            }`}
          >
            {buying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('processing')}
              </>
            ) : (
              <>
                <Coins size={16} className="h-4 w-4" />
                Purchase &middot; {total} coins
              </>
            )}
          </button>
        </div>
      }
    >
      {displayItem && (
        <div className="flex flex-col gap-9 pb-0 font-sans">
          
          {/* ==========================================================
              LEFT SIDE (ITEM DETAILS & QUANTITY)
          =========================================================== */}
          <div>
            <section>
              <div className="border-b border-white/[0.07]">
                <div className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-center">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.05]">
                    {Icon && <Icon className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-zinc-200">{displayItem.name}</h2>
                    </div>
                    <p className="mt-1.5 text-[10px] text-zinc-600">
                      +{displayItem.amountPerUnit} {displayItem.unit} per unit
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-700">{t('pricePerUnit')}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-zinc-100">
                      {displayItem.pricePerUnit} <span className="text-[12px] text-zinc-500">{t('coins')}</span>
                    </p>
                  </div>
                </div>
              </div>
              {displayItem.description && (
                <p className="mt-4 text-[11px] leading-5 text-[#555]">{displayItem.description}</p>
              )}
            </section>

            {/* Quantity stepper */}
            <section className="mt-9">
              <div className="mb-4 flex items-center justify-between">
                <CheckoutSectionTitle>{t('quantity')}</CheckoutSectionTitle>
                <span className="text-[10px] text-zinc-600">{t('maximum')} {maxQty}</span>
              </div>
              <div className="flex h-11 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616]">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={quantity <= 1}
                  className="flex w-12 items-center justify-center bg-[#111] text-[#666] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  id="store-quantity"
                  value={quantity}
                  onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-full min-w-0 bg-transparent text-center text-[13px] font-medium text-white outline-none"
                  min="1"
                  max={maxQty}
                />
                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={quantity >= maxQty}
                  className="flex w-12 items-center justify-center bg-[#111] text-[#666] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>
          </div>

          {/* ==========================================================
              RIGHT SIDE (ORDER SUMMARY & PAYMENT)
          =========================================================== */}
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">
                Order Summary
              </p>
              <div className="mt-4 space-y-3.5">
                <SummaryRow label="Price per unit" value={`${displayItem.pricePerUnit} coins`} />
                <SummaryRow label="Quantity" value={`× ${quantity}`} />
                <SummaryRow label={t("resource")} value={getTotalAmount(displayItem, quantity)} />
              </div>
            </div>

            <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[#555]">{t('total')}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    {total}
                  </p>
                </div>
                <span className="mb-1 text-[11px] text-[#555]">{t('coins')}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </Drawer>
  );
}
