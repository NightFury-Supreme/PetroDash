"use client";

import React, { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import dynamic from "next/dynamic";
import TicketsHeader from "@/components/tickets/TicketsHeader";
import { TicketNavSidebar } from "@/components/tickets/TicketNavSidebar";
import { AdminTicketItem } from "@/components/admin/tickets";
import AdminTicketsSkeleton from "@/components/skeletons/tickets/AdminTicketsSkeleton";
import { TicketPagination } from "@/components/tickets/TicketPagination";
import { TicketCategoryFilter } from "@/components/tickets/TicketCategoryFilter";
import { TicketSort } from "@/components/tickets/TicketSort";
import { Search, X, MessageSquare, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import { useAdminTickets } from "@/hooks/admin/tickets";
import { useTranslations } from "next-intl";

const TicketSettings = dynamic(
  () => import("@/components/admin/tickets").then((mod) => mod.TicketSettings),
  { ssr: false }
);

const PAGE_SIZE = 25;

export default function AdminTicketsPage() {
  const t = useTranslations('AdminTickets');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  useEffect(() => { setPage(1); }, [catFilter, sortBy, activeTab]);

  const {
    tickets,
    total,
    loading,
    error,
    categories,
    counts,
    countsLoading,
    handleTicketAction
  } = useAdminTickets(activeTab, catFilter, sortBy, debouncedQ, page, PAGE_SIZE);

  useEffect(() => {
    if (error) showError(tErrorBackend.has(error) ? tErrorBackend(error) : error);
  }, [error, showError, tErrorBackend]);

  if (error) {
    return (
      <ErrorState
        fullScreen={false}
        header={<React.Fragment />}
        showFooter={false}
        icon={<MessageSquare strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
        kicker={t("load_error")}
        title={t("failed_to_load")}
        errorString={tErrorBackend.has(error) ? tErrorBackend(error) : error}
        description={<ErrorDescription error={error} topic={tCommon("tickets")} />}
        buttons={
          <>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              {tCommon("retry")}
            </button>
            <DashboardButton variant="secondary" />
          </>
        }
      />
    );
  }

  const getTabTitle = () => {
    if (activeTab === 'all') return t("all_tickets");
    if (activeTab === 'open') return t("open_tickets_title");
    if (activeTab === 'pending') return t("pending_tickets_title");
    if (activeTab === 'resolved') return t("resolved_tickets_title");
    if (activeTab === 'closed') return t("closed_tickets_title");
    if (activeTab === 'deleted') return t("deleted_tickets_title");
    return t("all_tickets");
  };

  const getTabDescription = () => {
    if (activeTab === 'all') return t("all_tickets_desc");
    if (activeTab === 'open') return t("open_tickets_desc");
    if (activeTab === 'pending') return t("pending_tickets_desc");
    if (activeTab === 'resolved') return t("resolved_tickets_desc");
    if (activeTab === 'closed') return t("closed_tickets_desc");
    if (activeTab === 'deleted') return t("deleted_tickets_desc");
    return "";
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <TicketsHeader title={t('supportTickets')} description={t('manageAllUserTickets')} />
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <TicketNavSidebar
            activeStatus={activeTab}
            onStatusChange={v => { setActiveTab(v); setPage(1); }}
            counts={counts}
            loading={countsLoading}
            onOpenSettings={() => setShowSettings(true)}
          />

          <div className="flex-1 min-w-0 w-full">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white capitalize">
                {getTabTitle()}
              </h2>
              <p className="mt-0.5 text-xs text-[#666]">
                {getTabDescription()}
              </p>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-[10px]">
              <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-lg bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors">
                <Search size={14} className="shrink-0 text-[#555]" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="shrink-0 w-[23px] h-[23px] flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <TicketCategoryFilter
                  categories={categories}
                  value={catFilter}
                  onChange={(cat) => setCatFilter(cat)}
                />
                <TicketSort value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            <div className="border-0 p-0">
              {loading ? (
                <AdminTicketsSkeleton />
              ) : tickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/25">{t("no_tickets_found")}</div>
              ) : (
                <div>
                  <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
                    <span>{tCommon("ticket")}</span>
                    <span>{tCommon("user")}</span>
                    <span>{tCommon("category")}</span>
                    <span>{tCommon("updated")}</span>
                    <span>{tCommon("status")}</span>
                    <span>{tCommon("priority")}</span>
                    <span className="text-right">{t("actions")}</span>
                  </div>

                  <div className="divide-y divide-[#222]">
                    {tickets.map(tData => (
                      <AdminTicketItem key={tData.id} t={tData} onAction={async (action, id) => {
                        try {
                          await handleTicketAction(action, id);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : tCommon("error");
                          showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : msg);
                        }
                      }} />
                    ))}
                  </div>

                  <TicketPagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalItems={total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {showSettings && <TicketSettings onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}

