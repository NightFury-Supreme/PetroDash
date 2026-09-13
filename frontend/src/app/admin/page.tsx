"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SideItem } from "@/components/profile/ProfileComponents";
import {
  Activity, ChevronDown, CreditCard, HardDrive, MessageSquare, RefreshCw, Users,
} from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { OverviewTab } from "@/components/admin/dashboard/OverviewTab";
import { UsersTab } from "@/components/admin/dashboard/UsersTab";
import { InfrastructureTab } from "@/components/admin/dashboard/InfrastructureTab";
import { RevenueTab } from "@/components/admin/dashboard/RevenueTab";
import { SupportTab } from "@/components/admin/dashboard/SupportTab";
import { AdminSkeleton } from "@/components/skeletons/admin/AdminSkeleton";

function decodeJwt(token: string): { userId?: string; username?: string; role?: string } | null {
  try {
    const [, payload] = token.split('.');
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(json, (c: string) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  } catch {
    try {
      const [, payload] = token.split('.');
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}

type Tab = "overview" | "users" | "infrastructure" | "revenue" | "support";
type Range = "7D" | "14D" | "30D";

export default function AdminDashboard() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>("7D");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    if (!t) { router.replace('/login'); return; }
    setToken(t);
    const decoded = decodeJwt(t);
    if (decoded?.role !== 'admin') router.replace('/dashboard');
  }, [router]);

  const refresh = async () => {
    if (refreshing || !token) return;
    setRefreshing(true);
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/stats?range=${range}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setStats(d);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  };

  useEffect(() => { refresh(); }, [token, range]);

  if (!stats) return <AdminSkeleton />;

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Admin Dashboard</h1>
              <p className="text-[#888888] mt-1 text-sm">Monitor platform activity, infrastructure, revenue and support performance.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#222] text-[#D4D4D4] hover:bg-[#333] transition-colors" onClick={refresh}>
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
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Dashboard</p>
              </div>
              <nav className="space-y-1">
                <SideItem icon={Activity} label="Overview" active={tab === "overview"} onClick={() => setTab("overview")} />
                <SideItem icon={Users} label="Users" active={tab === "users"} onClick={() => setTab("users")} />
                <SideItem icon={HardDrive} label="Infrastructure" active={tab === "infrastructure"} onClick={() => setTab("infrastructure")} />
                <SideItem icon={CreditCard} label="Revenue & Plans" active={tab === "revenue"} onClick={() => setTab("revenue")} />
                <SideItem icon={MessageSquare} label="Support" active={tab === "support"} onClick={() => setTab("support")} />
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
