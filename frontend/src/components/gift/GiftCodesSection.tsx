"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import { useEffect, useState } from "react";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { GiftCodeRow } from "./GiftCodeRow";
import { GiftCodesTableSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";

type TabStatus = "Active" | "Inactive";

interface GiftCodesSectionProps {
  onRefreshRef?: (fn: () => void) => void;
}

function rewardLabel(g: any): string {
  const parts: string[] = [];
  if (g.rewards?.coins > 0) parts.push(`${g.rewards.coins} coins`);
  const r = g.rewards?.resources || {};
  if (r.diskMb > 0) parts.push(`${r.diskMb} MB Disk`);
  if (r.memoryMb > 0) parts.push(`${r.memoryMb} MB RAM`);
  if (r.cpuPercent > 0) parts.push(`${r.cpuPercent}% CPU`);
  if (r.allocations > 0) parts.push(`${r.allocations} Ports`);
  if (r.backups > 0) parts.push(`${r.backups} Backups`);
  if (r.databases > 0) parts.push(`${r.databases} DBs`);
  if (r.serverSlots > 0) parts.push(`${r.serverSlots} Slots`);
  return parts.length ? parts.join(" · ") : "No rewards";
}

export function GiftCodesSection({ onRefreshRef }: GiftCodesSectionProps) {
  const { showError, showSuccess } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>("Active");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const CODES_PER_PAGE = 10;

  const loadCodes = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) return;
      const statusParam = activeTab.toLowerCase();
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/gifts/mine?paginate=true&page=${page}&pageSize=${CODES_PER_PAGE}&status=${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let d: any = {};
      try { d = await res.json(); } catch {}
      if (d.data) {
        setCodes(d.data);
        setTotalCodes(d.meta?.total || 0);
        setTotalPages(Math.ceil((d.meta?.total || 0) / CODES_PER_PAGE) || 1);
        setActiveCount(d.meta?.activeCount || 0);
        setInactiveCount(d.meta?.inactiveCount || 0);
      } else if (Array.isArray(d)) {
        setCodes(d);
      } else if (!res.ok) {
        throw new Error(d.error || "Failed to load gift codes");
      }
    } catch (err: any) { 
      showError(err.message || "Failed to load gift codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    loadCodes();
    if (onRefreshRef) onRefreshRef(() => {
      setPage(1);
      loadCodes();
    });
  }, [page, activeTab]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccess("Gift code copied to clipboard!");
    } catch {
      showError("Failed to copy code.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-[42px] w-full animate-pulse rounded-lg bg-[#151515]" />
        <div className="h-[42px] w-full animate-pulse rounded-lg bg-[#151515]" />
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-6">
        {/* LEFT NAV — matches dashboard sidebar style */}
        <aside className="w-full lg:w-48 shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Status Filter</p>
            </div>
            <nav className="space-y-1">
              {(["Active", "Inactive"] as TabStatus[]).map((tab) => {
                const count = tab === "Active" ? activeCount : inactiveCount;
                const selected = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`group flex items-center justify-between w-full rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
                      selected
                        ? "bg-white/10 text-white"
                        : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        selected
                          ? tab === "Active" ? "bg-[#00FF88]" : "bg-zinc-400"
                          : "bg-zinc-600"
                      }`} />
                      <span className="truncate">{tab}</span>
                    </span>
                    <span className={`text-xs ${selected ? "text-zinc-400" : "text-zinc-600"}`}>{count}</span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-8 pt-4">
              <p className="text-xs leading-relaxed text-[#555]">
                Codes automatically move to inactive when they expire or reach their redemption limit.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <div className="flex-1 min-w-0 w-full dashboard-content-wrapper mb-6">
          <div className="mb-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-1">MANAGEMENT</div>
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">Your Gift Codes</h2>
            <p className="text-xs text-[#888] mt-1">Review, monitor, and manage the gift codes you have created for others.</p>
          </div>
          
          <div className="mt-4">
            {loading ? (
              <GiftCodesTableSkeleton />
            ) : codes.length > 0 ? (
              <>
                <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 lg:grid">
                  <span>Code</span>
                  <span>Reward</span>
                  <span>Expires</span>
                  <span>Uses</span>
                  <span>Status</span>
                  <span className="text-right">Action</span>
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {codes.map((g) => (
                    <GiftCodeRow
                      key={g._id}
                      code={g.code}
                      description={g.description}
                      reward={rewardLabel(g)}
                      expires={g.validUntil ? new Date(g.validUntil).toLocaleDateString() : "—"}
                      uses={`${g.redeemedCount || 0}${g.maxRedemptions ? ` / ${g.maxRedemptions}` : ""}`}
                      status={activeTab}
                      onCopy={() => copyCode(g.code)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <Ticket className="h-4 w-4 text-[#555]" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#888888]">
                    No {activeTab.toLowerCase()} codes
                  </p>
                  <p className="mt-1 text-xs text-[#555]">
                    Codes with this status will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
              <p className="text-[10px] text-white/30">
                Showing {codes.length > 0 ? (page - 1) * CODES_PER_PAGE + 1 : 0}
                {"–"}
                {Math.min(page * CODES_PER_PAGE, totalCodes)} of {totalCodes} codes
              </p>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                  // Only show a few pages around the current page to avoid clutter
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= page - 1 && pageNumber <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        disabled={loading}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs transition ${
                          page === pageNumber
                            ? "bg-orange-500 text-black font-medium"
                            : "text-white/30 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === page - 2 ||
                    pageNumber === page + 2
                  ) {
                    return <span key={pageNumber} className="text-white/20 text-xs px-1">...</span>;
                  }
                  return null;
                })}
                
                <button
                  type="button"
                  disabled={page === totalPages || loading}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
