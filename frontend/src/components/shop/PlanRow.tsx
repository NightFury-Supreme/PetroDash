"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Crown,
  ArrowUpRight,
  Flame,
  Package,
  Clock,
} from "lucide-react";
import type { ShopPlan } from "@/hooks/shop";

export interface PlanRowProps {
  plan: ShopPlan & {
    price?: number;
    currency?: string;
    strikeThroughPrice?: number;
    stock?: number;
    stockLeft?: number;
    availableUntil?: string;
    category?: string | { name?: string };
  };
  currency: string;
  onPurchase: () => void;
}

export function Resource({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035] text-white/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.13em] text-white/20">{label}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-white/70">{value}</p>
      </div>
    </div>
  );
}

export function PlanRow({ plan, currency, onPurchase }: PlanRowProps) {
  const t = useTranslations("Shop");
  const res = plan.productContent?.recurrentResources || {};
  const cpu = res.cpuPercent && res.cpuPercent > 0 ? `${res.cpuPercent}%` : "0%";
  const memory = res.memoryMb && res.memoryMb > 0 ? `${res.memoryMb} MB` : "0 MB";
  const disk = res.diskMb && res.diskMb > 0 ? `${res.diskMb} MB` : "0 MB";
  const servers =
    plan.productContent?.serverLimit && plan.productContent.serverLimit > 0
      ? `${plan.productContent.serverLimit}`
      : "0";
  const price = plan.pricePerMonth || plan.price;
  const planCurrency = plan.currency || currency;
  const billing = plan.lifetime ? t("oneTimePayment") : t("perMonth");
  const isOutOfStock = Boolean(plan.stock && plan.stock > 0 && plan.stockLeft === 0);

  return (
    <article className="group relative flex flex-col gap-5 py-5 transition hover:bg-white/[0.015]">
      {plan.popular && (
        <div className="absolute right-0 top-0 z-10 flex items-center justify-center rounded-bl border-b border-l border-[#FF5722]/30 bg-[#FF5722]/10 px-3 py-1 shadow-sm backdrop-blur-md">
          <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-[#FF5722]">
            <Flame className="h-3 w-3" />
            {t("popular")}
          </span>
        </div>
      )}
      <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
        {/* PLAN IDENTITY */}
        <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
            <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-medium text-white/70">{plan.name}</h2>
            </div>
            <p className="mt-0.5 text-xs text-white/35">
              {typeof plan.description === "string"
                ? plan.description.replace(/<[^>]+>/g, " ").trim()
                : plan.description}
            </p>
          </div>
        </div>

        {/* RESOURCES */}
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
          <Resource icon={<Cpu className="h-3.5 w-3.5" />} label={t("nameCpu")} value={cpu} />
          <Resource
            icon={<MemoryStick className="h-3.5 w-3.5" />}
            label={t("nameMemory")}
            value={memory}
          />
          <Resource
            icon={<HardDrive className="h-3.5 w-3.5" />}
            label={t("nameDisk")}
            value={disk}
          />
          <Resource
            icon={<Server className="h-3.5 w-3.5" />}
            label={t("nameServerSlots")}
            value={servers}
          />
        </div>

        {/* PRICE + ACTION */}
        <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
          <div className="text-left">
            <p className="text-[9px] uppercase tracking-[0.13em] text-white/20">{t("price")}</p>
            <div className="mt-0.5 flex items-baseline">
              {Boolean(plan.strikeThroughPrice && plan.strikeThroughPrice > 0) && (
                <span className="text-xs text-white/30 line-through mr-1">
                  {plan.strikeThroughPrice} {planCurrency}
                </span>
              )}
              <span className="text-lg font-semibold tracking-tight text-white/90">{price}</span>
              <span className="ml-1 text-[10px] text-white/35">{planCurrency}</span>
            </div>
            <p className="text-[10px] text-white/35">{billing}</p>
          </div>

          <button
            type="button"
            onClick={onPurchase}
            disabled={isOutOfStock}
            className={`group flex h-9 shrink-0 items-center gap-2 rounded-md px-4 text-xs font-semibold transition-all focus:outline-none focus:ring-2 ${
              isOutOfStock
                ? "bg-[#333] text-[#777] cursor-not-allowed"
                : "bg-[#FF5722] text-white hover:bg-[#E64D1F] focus:ring-[#FF5722]/40"
            }`}
          >
            {isOutOfStock ? t("soldOut") : plan.lifetime ? t("purchase") : t("subscribe")}
            {!isOutOfStock && (
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 pt-4 w-full">
        <div className="flex flex-wrap items-center gap-4">
          {plan.lifetime && (
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-white/40">{t("lifetimeAccess")}</span>
            </div>
          )}
          {Boolean(plan.stock && plan.stock > 0) && (
            <div className="flex items-center gap-1.5">
              <Package
                className={`h-3.5 w-3.5 ${
                  plan.stockLeft === 0 ? "text-red-500" : "text-orange-400"
                }`}
              />
              <span className="text-xs text-white/40">
                {plan.stockLeft === 0 ? (
                  <span className="text-red-500 font-medium">{t("soldOut")}</span>
                ) : plan.stockLeft && plan.stockLeft <= 5 ? (
                  <span className="text-orange-400 font-medium">
                    {plan.stockLeft} {t("stock")} {t("left")}
                  </span>
                ) : (
                  <span>{t("limitedStock")}</span>
                )}
              </span>
            </div>
          )}
          {plan.availableUntil && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-white/40">
                {t("ends")}{" "}
                {new Date(plan.availableUntil).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-white/20 shrink-0 ml-4 hidden sm:block">
          {plan.lifetime ? t("oneTimePurchase") : t("recurringSubscription")}
        </span>
      </div>
    </article>
  );
}
