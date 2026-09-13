"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import TicketsHeader from "@/components/tickets/TicketsHeader";
import { TicketNavSidebar } from "@/components/tickets/TicketNavSidebar";
import TicketItem from "@/components/tickets/TicketItem";
import TicketsSkeleton from "@/components/skeletons/tickets/TicketsSkeleton";
import { TicketPagination } from "@/components/tickets/TicketPagination";
import { TicketCategoryFilter } from "@/components/tickets/TicketCategoryFilter";
import { TicketSort } from "@/components/tickets/TicketSort";
import { useToast } from "@/components/ui/ToastProvider";
import { CreateTicketDrawer } from "@/components/tickets/CreateTicketDrawer";
import { useTickets } from "@/hooks/useTickets";
import { Search, X, MessageSquare, RefreshCw } from "lucide-react";
import { TicketAction } from "@/components/tickets/types";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";

const PAGE_SIZE = 25;

export default function TicketsPage() {
  const { showError, showSuccess } = useToast();
  
  const { tickets, loading, error, categories, updateStatus, createTicket } = useTickets();

  // Search + filter + sort + pagination
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [createCategory, setCreateCategory] = useState("general");
  const [createPriority, setCreatePriority] = useState("low");
    const [creating, setCreating] = useState(false);
  
  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    clearTimeout(debounceRef.current as NodeJS.Timeout);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current as NodeJS.Timeout);
  }, [q]);

  // Reset page when filters change
  useEffect(() => setPage(1), [activeTab, catFilter, sortBy]);

  // Derived state from loaded tickets
  const filteredTickets = useMemo(() => {
    let result = [...tickets];
    
    // Status filter
    if (activeTab !== "all") {
      if (activeTab === "deleted") {
        result = result.filter(t => t.deletedByUser);
      } else {
        result = result.filter(t => t.status === activeTab && !t.deletedByUser);
      }
    } else {
      result = result.filter(t => !t.deletedByUser); // Hide deleted in "all"
    }

    // Category filter
    if (catFilter) {
      result = result.filter(t => t.category === catFilter);
    }

    // Search filter
    if (debouncedQ) {
      const qLower = debouncedQ.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(qLower) || 
        t._id.toLowerCase().includes(qLower) ||
        t.category?.toLowerCase().includes(qLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "updated_desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "updated_asc") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "created_desc") return new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime();
      if (sortBy === "created_asc") return new Date(a.createdAt || a.updatedAt).getTime() - new Date(b.createdAt || b.updatedAt).getTime();
      return 0;
    });

    return result;
  }, [tickets, activeTab, catFilter, debouncedQ, sortBy]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: tickets.filter(t => !t.deletedByUser).length,
      open: tickets.filter(t => t.status === "open" && !t.deletedByUser).length,
      pending: tickets.filter(t => t.status === "pending" && !t.deletedByUser).length,
      resolved: tickets.filter(t => t.status === "resolved" && !t.deletedByUser).length,
      closed: tickets.filter(t => t.status === "closed" && !t.deletedByUser).length,
      deleted: tickets.filter(t => t.deletedByUser).length,
    };
  }, [tickets]);

  // Pagination slice
  const total = filteredTickets.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const paginatedTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handlers
  const handleAction = useCallback(async (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string) => {
    const mappedAction = action === 'resolve' ? 'resolved' : action;
    const res = await updateStatus(id, mappedAction as TicketAction);
    if (res && !res.ok) {
      throw new Error(res.error || 'Failed to update ticket');
    }
  }, [updateStatus]);

  const openCreate = useCallback(() => {
    
    setCreateTitle("");
    setCreateMessage("");
    setCreateCategory(categories[0] || "general");
    setCreatePriority("low");
    setShowCreate(true);
  }, [categories]);

  const handleCreate = useCallback(async () => {
    
    if (!createTitle.trim()) { showError('Subject is required'); return; }
    if (createMessage.trim().length < 3) { showError('Message must be at least 3 characters'); return; }
    setCreating(true);
    const result = await createTicket({ title: createTitle, message: createMessage, category: createCategory, priority: createPriority });
    if (result.ok) {
      showSuccess("Ticket created successfully");
      setShowCreate(false);
      openCreate();
    } else {
      showError(result.error || 'Failed to create ticket');
    }
    setCreating(false);
  }, [createTitle, createMessage, createCategory, createPriority, createTicket, openCreate]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<MessageSquare strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Tickets"
          errorString={error}
          description={<ErrorDescription error={error} topic="Tickets" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col h-full space-y-6">
        <TicketsHeader 
          title="Tickets"
          description="Manage your support requests"
          loading={loading}
          onNew={openCreate}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <TicketNavSidebar 
            activeStatus={activeTab} 
            onStatusChange={setActiveTab} 
            counts={counts}
            loading={loading} 
          />

          <div className="flex-1 min-w-0 w-full">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-[10px]">
              <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors">
                <Search size={14} className="shrink-0 text-[#555]" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="shrink-0 w-[23px] h-[23px] flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <TicketSort 
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </div>
            </div>

            <TicketCategoryFilter 
              categories={categories}
              activeTab={activeTab}
              catFilter={catFilter}
              tickets={tickets}
              loading={loading}
              onSelect={setCatFilter}
            />

            <div className="border-0 p-0">
              {loading && tickets.length === 0 ? (
                <TicketsSkeleton isAdmin={false} />
              ) : paginatedTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/25">
                  {q || activeTab !== "all" || catFilter
                    ? "No tickets found matching your filters."
                    : "You haven't opened any support tickets yet."}
                </div>
              ) : (
                <div>
                  <div className="hidden grid-cols-[1fr_100px_90px_80px_60px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
                    <span>Ticket</span>
                    <span>Category</span>
                    <span>Updated</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span />
                  </div>
                  
                  <div className="divide-y divide-[#222]">
                    {paginatedTickets.map((t: any) => (
                      <TicketItem 
                        key={t._id} 
                        t={t} 
                        onAction={handleAction} 
                        isAdmin={false} 
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <TicketPagination 
                      page={page} 
                      pageSize={PAGE_SIZE} 
                      totalItems={total} 
                      onPageChange={setPage} 
                    />
                  )}
                </div>
              )}
            </div>
          </div>
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
