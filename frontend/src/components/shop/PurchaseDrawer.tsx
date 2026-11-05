"use client";

import { useState } from "react";
import { Coins, Minus, Plus, Loader2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslations } from "next-intl";
import type { ShopItem } from "@/hooks/shop";
import { getCachedUserSync } from "@/utils/userCache";
import {
  getTotalAmount,
  MAX_QUANTITY,
  SummaryRow,
  getLocalizedItemName,
  getLocalizedItemDescription,
} from "./shopUtils";

interface PurchaseDrawerProps {
  item: ShopItem | null;
  quantity: number;
  total: number;
  coins?: number | null;
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
  coins,
  buying,
  onClose,
  onDecrease,
  onIncrease,
  onQuantityChange,
  onConfirm,
}: PurchaseDrawerProps) {
  const t = useTranslations("Shop");
  const tCommon = useTranslations("Common");
  const [lastItem, setLastItem] = useState<ShopItem | null>(null);

  if (item && item !== lastItem) {
    setLastItem(item);
  }

  const displayItem = item || lastItem;
  const maxQty = displayItem ? displayItem.maxPerPurchase || MAX_QUANTITY : MAX_QUANTITY;

  const userCoins = typeof coins === "number" ? coins : (getCachedUserSync()?.coins ?? 0);
  const hasEnoughCoins = userCoins >= total;
  const isPurchaseDisabled = buying || !displayItem || !hasEnoughCoins;

  return (
    <Drawer
      isOpen={!!item}
      onClose={onClose}
      title={t("checkout")}
      subtitle={t("completePurchase")}
      icon={<Coins className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={async () => {
              if (isPurchaseDisabled) return;
              const success = await onConfirm();
              if (success) {
                onClose();
              }
            }}
            disabled={isPurchaseDisabled}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isPurchaseDisabled
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] text-white hover:bg-[#E64D1F] border border-transparent"
            }`}
          >
            {buying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <Coins size={16} className="h-4 w-4" />
                {t("purchase")} &middot; {total} {t("coins")}
              </>
            )}
          </button>
        </div>
      }
    >
      {displayItem && (
        <div className="flex flex-col gap-9 pb-0 font-sans">
          <div>
            <section>
              <div className="border-b border-white/[0.07]">
                <div className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-zinc-200">
                        {getLocalizedItemName(displayItem.key, displayItem.name, t)}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-[10px] text-zinc-600">
                      +{displayItem.amountPerUnit ?? displayItem.amount ?? 0} {displayItem.unit} {t("perUnit")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-700">{t("pricePerUnit")}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-zinc-100">
                      {displayItem.pricePerUnit ?? displayItem.price ?? 0}{" "}
                      <span className="text-[12px] text-zinc-500">{t("coins")}</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-[#555]">
                {getLocalizedItemDescription(
                  displayItem.key,
                  displayItem.description || displayItem.name,
                  t
                )}
              </p>
            </section>

            <section className="mt-9">
              <div className="mb-4 flex items-center justify-between">
                <CheckoutSectionTitle>{t("quantity")}</CheckoutSectionTitle>
                <span className="text-[10px] text-zinc-600">
                  {t("maximum")} {maxQty}
                </span>
              </div>
              <div className="flex h-11 overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616]">
                <button
                  type="button"
                  onClick={onDecrease}
                  disabled={quantity <= 1}
                  aria-label={t("decreaseQuantity")}
                  className="flex w-12 items-center justify-center bg-[#111] text-[#666] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  id="store-quantity"
                  value={quantity}
                  aria-label={t("quantity")}
                  onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
                  className="w-full min-w-0 bg-transparent text-center text-[13px] font-medium text-white outline-none"
                  min="1"
                  max={maxQty}
                />
                <button
                  type="button"
                  onClick={onIncrease}
                  disabled={quantity >= maxQty}
                  aria-label={t("increaseQuantity")}
                  className="flex w-12 items-center justify-center bg-[#111] text-[#666] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">
                {t("orderSummary")}
              </p>
              <div className="mt-4 space-y-3.5">
                <SummaryRow
                  label={t("pricePerUnit")}
                  value={`${displayItem.pricePerUnit ?? displayItem.price ?? 0} ${t("coins")}`}
                />
                <SummaryRow label={t("quantity")} value={`× ${quantity}`} />
                <SummaryRow label={tCommon("resource")} value={getTotalAmount(displayItem, quantity)} />
              </div>
            </div>

            <div className={`rounded-lg border p-4 transition-colors ${
              !hasEnoughCoins
                ? "border-red-500/20 bg-red-500/[0.03]"
                : "border-[#2A2A2A] bg-[#161616]"
            }`}>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[#555]">{t("total")}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    {total}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-[#555]">{tCommon("balance")}</p>
                  <p className={`mt-0.5 text-xs font-medium ${!hasEnoughCoins ? "text-red-400" : "text-white/60"}`}>
                    {userCoins} {t("coins")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
