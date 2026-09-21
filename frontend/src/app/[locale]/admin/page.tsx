"use client";

import React, { useState } from "react";
import { SideItem } from "@/components/profile";
import {
  Activity, ChevronDown, CreditCard, HardDrive, MessageSquare, RefreshCw, Users,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import {
  OverviewTab,
  UsersTab,
  InfrastructureTab,
  RevenueTab,
  SupportTab,
} from "@/components/admin/dashboard";
import { AdminSkeleton } from "@/components/skeletons/admin/AdminSkeleton";
import { useAdminDashboard } from "@/hooks/admin/dashboard";
import { useTranslations } from 'next-intl';

type Tab = "overview" | "users" | "infrastructure" | "revenue" | "support";
type Range = "7D" | "14D" | "30D";

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const { currency } = useCurrency();
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>("7D");
  const [rangeOpen, setRangeOpen] = useState(false);
  
  const { stats, error, refreshing, refresh } = useAdminDashboard(range);

  if (error) {
    const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center p-8 bg-[#161616] border border-[#282828] rounded-xl max-w-md w-full text-center">
          <Activity size={32} className="text-red-500 mb-4 opacity-80" />
          <h2 className="text-white font-medium text-lg mb-2">{t('failedToLoad')}</h2>
          <p className="text-[#888] text-sm mb-6">{displayError}</p>
          <button onClick={() => refresh(true)} className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {tCommon('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return <AdminSkeleton />;

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
              <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#222] text-[#D4D4D4] hover:bg-[#333] transition-colors" onClick={() => refresh(true)}>
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </button>
              <div className="relative">
                <button className="flex items-center gap-2 rounded-lg bg-[#222] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:bg-[#333] transition-colors" onClick={() => setRangeOpen((v) => !v)}>
                  {range} <ChevronDown size={16} />
                </button>
                {rangeOpen && (
                  <div className="absolute right-0 mt-2 w-24 rounded-lg border border-[#333] bg-[#151515] p-1 shadow-xl z-50">
                    <button className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-[#AAA] hover:bg-[#222] hover:text-white" onClick={() => { setRange("7D"); setRangeOpen(false); }}>7D</button>
                    <button className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-[#AAA] hover:bg-[#222] hover:text-white" onClick={() => { setRange("14D"); setRangeOpen(false); }}>14D</button>
                    <button className="block w-full rounded-md px-3 py-1.5 text-left text-sm text-[#AAA] hover:bg-[#222] hover:text-white" onClick={() => { setRange("30D"); setRangeOpen(false); }}>30D</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('dashboard')}</p>
              </div>
              <nav className="space-y-1">
                <SideItem icon={Activity} label={t('tabs.overview')} active={tab === "overview"} onClick={() => setTab("overview")} />
                <SideItem icon={Users} label={t('tabs.users')} active={tab === "users"} onClick={() => setTab("users")} />
                <SideItem icon={HardDrive} label={t('tabs.infrastructure')} active={tab === "infrastructure"} onClick={() => setTab("infrastructure")} />
                <SideItem icon={CreditCard} label={t('tabs.revenue')} active={tab === "revenue"} onClick={() => setTab("revenue")} />
                <SideItem icon={MessageSquare} label={t('tabs.support')} active={tab === "support"} onClick={() => setTab("support")} />
              </nav>
            </div>
          </aside>
          <div className="flex-1 min-w-0 w-full dashboard-content-wrapper">
            <main>
              {tab === "overview" && <OverviewTab stats={stats} currency={currency} />}
              {tab === "users" && <UsersTab stats={stats} currency={currency} range={range} />}
              {tab === "infrastructure" && <InfrastructureTab stats={stats} currency={currency} range={range} />}
              {tab === "revenue" && <RevenueTab stats={stats} currency={currency} range={range} />}
              {tab === "support" && <SupportTab stats={stats} currency={currency} />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
