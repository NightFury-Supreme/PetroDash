"use client";

import React from "react";
import { useTranslations } from "next-intl";

import { Plus, Gift, Ticket } from "lucide-react";

export function GiftHeaderSkeleton() {
  const t = useTranslations("Gift");
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {t("title")} <span className="text-[#FF5722]">{t("titleHighlight")}</span>
        </h1>
        <p className="text-[#888888] mt-1 text-sm">
          {t("subtitle")}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button
          disabled
          className="flex items-center gap-2 bg-[#FF5722]/50 text-white/50 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed"
        >
          <Plus size={12} />
          {t("createCode")}
        </button>
      </div>
    </div>
  );
}

export function GiftRedeemSkeleton() {
  const t = useTranslations("Gift");
  return (
    <section className="border-y border-white/[0.06] divide-y divide-white/[0.06] sm:divide-y-0 sm:grid sm:grid-cols-2">
      <div className="flex flex-col p-6 sm:border-r sm:border-white/[0.06]">
        {/* Icon + label skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#222]">
            <Gift className="h-4 w-4 text-[#888888]" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">{t("redeemTitle")}</h2>
            <p className="mt-0.5 text-xs text-[#888888]">{t("redeemSubtitle")}</p>
          </div>
        </div>

        {/* Input row skeleton */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              disabled
              placeholder={t("redeemInputPlaceholder")}
              className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#151515] pl-9 pr-3 text-sm font-medium tracking-widest text-[#D4D4D4] outline-none placeholder:text-[#444] cursor-not-allowed"
            />
          </div>
          <button
            disabled
            className="flex items-center gap-2 rounded-lg px-4 text-xs font-medium transition bg-[#FF5722]/50 text-white/50 cursor-not-allowed"
          >
            {t("redeemButton")}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-2">{t("howItWorksTitle")}</div>
        <p className="text-sm text-[#888] leading-relaxed">
          {t("howItWorksBody")}
        </p>
      </div>
    </section>
  );
}

export function GiftCodesTableSkeleton() {
  const t = useTranslations("Gift");
  
  return (
    <div className="min-w-0 flex-1 flex flex-col">
      {/* Table header */}
      <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:grid">
        <span>{t("tableCode")}</span>
        <span>{t("tableReward")}</span>
        <span>{t("tableExpires")}</span>
        <span>{t("tableUses")}</span>
        <span>{t("tableStatus")}</span>
        <span className="text-right">{t("tableAction")}</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            {/* DESKTOP */}
            <div className="hidden lg:grid gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] items-center px-5 py-5">
              <div className="space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
                <div className="h-2 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-3 w-24 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-3 w-10 animate-pulse rounded-sm bg-white/[0.04]" />
              <div className="h-5 w-14 animate-pulse rounded bg-white/[0.04]" />
              <div className="flex justify-end">
                <div className="h-4 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
              </div>
            </div>
            
            {/* MOBILE */}
            <div className="p-4 lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="h-3.5 w-32 animate-pulse rounded-sm bg-white/[0.04]" />
                  <div className="h-2.5 w-24 animate-pulse rounded-sm bg-white/[0.04]" />
                </div>
                <div className="h-6 w-16 shrink-0 animate-pulse rounded bg-white/[0.04]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="h-2.5 w-12 animate-pulse rounded-sm bg-white/[0.04]" />
                    <div className="h-3 w-16 animate-pulse rounded-sm bg-white/[0.04]" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-8 w-full animate-pulse rounded border border-white/[0.06] bg-white/[0.02]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GiftCodesSkeleton() {
  const t = useTranslations("Gift");
  
  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-6">
        <aside className="w-full lg:w-48 shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t("statusFilter")}</p>
            </div>
            <nav className="space-y-1">
              {/* Active Tab Skeleton */}
              <button
                type="button"
                disabled
                className="group flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-sm transition-colors bg-white/10 text-white"
              >
                <span className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FF88]" />
                  <span className="truncate">{t("statusActive")}</span>
                </span>
                <span className="text-xs text-zinc-400">...</span>
              </button>
              {/* Inactive Tab Skeleton */}
              <button
                type="button"
                disabled
                className="group flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-zinc-500"
              >
                <span className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                  <span className="truncate">{t("statusInactive")}</span>
                </span>
                <span className="text-xs text-zinc-600">...</span>
              </button>
            </nav>
            <div className="mt-8 pt-4">
              <p className="text-xs leading-relaxed text-[#555]">
                {t("codesAutoMove")}
              </p>
            </div>
          </div>
        </aside>
        
        <div className="flex-1 min-w-0 w-full dashboard-content-wrapper mb-6">
          <div className="mb-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-1">{t("management")}</div>
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">{t("yourGiftCodes")}</h2>
            <p className="text-xs text-[#888] mt-1">{t("yourGiftCodesSubtitle")}</p>
          </div>
          
          <div className="mt-4">
             <GiftCodesTableSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

export function GiftSkeleton() {
  const t = useTranslations("Gift");
  
  return (
    <div className="flex flex-col h-full space-y-6">
      <GiftHeaderSkeleton />
      <GiftRedeemSkeleton />
      <GiftCodesSkeleton />
      <p className="mt-3 text-xs text-[#555]">
        {t("footerNote")}
      </p>
    </div>
  );
}
