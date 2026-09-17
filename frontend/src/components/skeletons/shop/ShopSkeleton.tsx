"use client";

import React from 'react';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ShopSkeleton() {
  const t = useTranslations('Shop');
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        
        {/* Top Nav + Header Skeleton */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('storeTitle')}</h1>
            <p className="text-[#888888] mt-1 text-sm">{t('storeSubtitle')}</p>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">
                {t('storeTitle')}
              </p>
            </div>
            
            <nav className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#222]/50 text-white font-medium text-sm border border-transparent">
                <ShoppingCart className="h-4 w-4" />
                {t('shopItems')}
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#888888] font-medium text-sm border border-transparent">
                <CreditCard className="h-4 w-4" />
                {t('plans')}
              </div>
            </nav>

            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                {t('purchaseHelpText')}
              </p>
            </div>
          </aside>

          {/* Main Content Skeleton (ShopItemsView mockup) */}
          <div className="flex-1 min-w-0 w-full">
            <section className="mt-8">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-white">{t('resources')}</h2>
                <p className="mt-0.5 text-xs text-[#666]">{t('purchaseHelpText')}</p>
              </div>

              <div className="w-full">
                {/* Column headers */}
                <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
                  <span>{t('resource')}</span>
                  <span>{t('included')}</span>
                  <span>{t('price')}</span>
                  <span className="text-right">{t('action')}</span>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-4 px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_80px] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035] animate-pulse"></div>
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-white/[0.04] animate-pulse rounded"></div>
                          <div className="h-2 w-40 max-w-full bg-white/[0.04] animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-12 bg-white/[0.04] animate-pulse rounded"></div>
                        <div className="h-2.5 w-8 bg-white/[0.04] animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-6 bg-white/[0.04] animate-pulse rounded"></div>
                        <div className="h-3.5 w-12 bg-white/[0.04] animate-pulse rounded"></div>
                      </div>
                      <div className="flex justify-end mt-2 md:mt-0">
                        <div className="h-8 w-full md:w-16 bg-white/[0.04] animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
