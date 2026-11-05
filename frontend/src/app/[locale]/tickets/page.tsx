"use client";

import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import TicketsHeader from "@/components/tickets/TicketsHeader";
import { TicketNavSidebar } from "@/components/tickets/TicketNavSidebar";
import TicketItem from "@/components/tickets/TicketItem";
import TicketsSkeleton from "@/components/skeletons/tickets/TicketsSkeleton";
import { TicketPagination } from "@/components/tickets/TicketPagination";
import { TicketCategoryFilter } from "@/components/tickets/TicketCategoryFilter";
import { TicketSort } from "@/components/tickets/TicketSort";
import { useToast } from "@/components/ui/ToastProvider";
import { useTickets } from "@/hooks/tickets";
import { Search, X, MessageSquare, RefreshCw } from "lucide-react";
import type { TicketAction } from "@/components/tickets/types";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";

const CreateTicketDrawer = dynamic(
  () => import("@/components/tickets/CreateTicketDrawer").then((mod) => mod.CreateTicketDrawer),
  { ssr: false }
);

const PAGE_SIZE = 25;

export default function TicketsPage() {
  const t = useTranslations("Tickets");
  const tCommon = useTranslations("Common");
  const tError = useTranslations("GlobalErrors");
  const { showError, showSuccess } = useToast();

  const { tickets, loading, error, categories, updateStatus, createTicket, fetchTickets, pagination, counts } = useTickets();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createCategory, setCreateCategory] = useState("general");
  const [createPriority, setCreatePriority] = useState("low");
  const [creating, setCreating] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  useEffect(() => setPage(1), [activeTab, catFilter, sortBy]);

  useEffect(() => {
    fetchTickets({
      page,
      limit: PAGE_SIZE,
      status: activeTab,
      category: catFilter,
      search: debouncedQ,
      sortBy,
    });
  }, [page, activeTab, catFilter, debouncedQ, sortBy, fetchTickets]);

  const totalPages = pagination?.pages || 1;

  if (error) {
    return (
      <ErrorState
        fullScreen={false}
        header={<React.Fragment />}
        showFooter={false}
        icon={<RefreshCw className="w-12 h-12" />}
        kicker={t("loadError")}
        title={tError("failedToLoadTickets")}
        errorString={error}
        description={<ErrorDescription error={error} topic={tCommon("tickets")} />}
        buttons={
          <>
            <button
              onClick={() => fetchTickets({
                page,
                limit: PAGE_SIZE,
                status: activeTab,
                category: catFilter,
                search: debouncedQ,
                sortBy,
              })}
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

  const handleCreate = async () => {
    if (!createTitle.trim() || !createMessage.trim()) {
      showError(t("errors.titleAndMessageRequired"));
      return;
    }
    setCreating(true);
    const { ok, error: err } = await createTicket({
      title: createTitle,
      message: createMessage,
      category: createCategory,
      priority: createPriority,
    });
    setCreating(false);
    if (ok) {
      showSuccess(t("createTicket"));
      setShowCreate(false);
      setCreateTitle("");
      setCreateMessage("");
      setCreateCategory("general");
      setCreatePriority("low");

      await fetchTickets(
        {
          page,
          limit: PAGE_SIZE,
          status: activeTab,
          category: catFilter,
          search: debouncedQ,
          sortBy,
        },
        { silent: true }
      );
    } else {
      showError(err || tError("failedToLoadTickets"));
    }
  };

  const onAction = async (id: string, action: TicketAction) => {
    const { ok, error: err } = await updateStatus(id, action);
    if (ok) {
      await fetchTickets(
        {
          page,
          limit: PAGE_SIZE,
          status: activeTab,
          category: catFilter,
          search: debouncedQ,
          sortBy,
        },
        { silent: true }
      );
      showSuccess(action === "reopen" ? t("ticketReopened") : t("ticketResolved"));
    } else {
      showError(err || (action === "reopen" ? t("failedToReopen") : t("failedToResolve")));
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex flex-col gap-6 w-full max-w-full overflow-x-hidden relative">
      <TicketsHeader
        loading={loading}
        onRefresh={() =>
          fetchTickets({
            page,
            limit: PAGE_SIZE,
            status: activeTab,
            category: catFilter,
            search: debouncedQ,
            sortBy,
          })
        }
        onNew={() => setShowCreate(true)}
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full min-h-0">
        <TicketNavSidebar
          counts={{ ...counts, deleted: 0 }}
          activeStatus={activeTab}
          onStatusChange={setActiveTab}
          loading={loading && counts.all === 0}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-lg bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors">
              <Search size={14} className="shrink-0 text-[#555]" />
              <input
                type="text"
                placeholder={t("searchTickets")}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="shrink-0 w-[23px] h-[23px] flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <TicketCategoryFilter
                categories={categories}
                value={catFilter}
                onChange={setCatFilter}
              />
              <TicketSort value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {loading ? (
            <div className="w-full">
              <TicketsSkeleton />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              {tickets.length > 0 ? (
                <div>
                  <div className="hidden grid-cols-[1.5fr_1fr_1fr_100px_80px_120px] gap-4 border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
                    <span>{t("subject")}</span>
                    <span>{t("category")}</span>
                    <span>{t("updated")}</span>
                    <span>{tCommon("status")}</span>
                    <span>{t("priority")}</span>
                    <span className="text-right">{t("actions")}</span>
                  </div>

                  <div className="divide-y divide-[#222]">
                    {tickets.map((tData) => (
                      <TicketItem
                        key={tData.id}
                        ticket={tData}
                        onAction={(action) => onAction(tData.id, action)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare className="h-10 w-10 text-[#505050] mb-4 opacity-50" />
                  <h3 className="text-[15px] font-medium text-[#d5d5d5] mb-2">
                    {t("noTicketsFound")}
                  </h3>
                  <p className="text-[#888] text-[13px] max-w-[300px]">
                    {t("noTicketsDesc")}
                  </p>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="mt-6 flex justify-center">
              <TicketPagination
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={pagination?.total || counts.all}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateTicketDrawer
          title={createTitle}
          message={createMessage}
          category={createCategory}
          priority={createPriority}
          categories={categories}
          creating={creating}
          onTitleChange={setCreateTitle}
          onMessageChange={setCreateMessage}
          onCategoryChange={setCreateCategory}
          onPriorityChange={setCreatePriority}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
