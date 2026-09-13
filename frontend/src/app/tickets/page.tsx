"use client";

import React, { useEffect, useState, useRef } from "react";
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
  
  const { tickets, loading, error, categories, updateStatus, createTicket, fetchTickets, pagination, counts } = useTickets();

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

  // Fetch from server when dependencies change
  useEffect(() => {
    fetchTickets({
      page,
      limit: PAGE_SIZE,
      status: activeTab,
      category: catFilter,
      search: debouncedQ,
      sortBy
    });
  }, [page, activeTab, catFilter, debouncedQ, sortBy, fetchTickets]);

  const totalPages = pagination?.pages || 1;

  // Render logic
  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex items-center justify-center">
        <ErrorState icon={RefreshCw} title="Failed to load tickets">
          <ErrorDescription>{error}</ErrorDescription>
          <DashboardButton onClick={() => window.location.reload()}>Retry</DashboardButton>
        </ErrorState>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!createTitle.trim() || !createMessage.trim()) {
      showError("Please fill out all required fields.");
      return;
    }
    setCreating(true);
    const { ok, error: err } = await createTicket({
      title: createTitle,
      message: createMessage,
      category: createCategory,
      priority: createPriority
    });
    setCreating(false);
    if (ok) {
      showSuccess("Ticket created successfully.");
      setShowCreate(false);
      setCreateTitle("");
      setCreateMessage("");
      setCreateCategory("general");
      setCreatePriority("low");
      
      // Refresh list
      fetchTickets({
        page, limit: PAGE_SIZE, status: activeTab, category: catFilter, search: debouncedQ, sortBy
      });
    } else {
      showError(err || "Failed to create ticket.");
    }
  };

  const onAction = async (id: string, action: TicketAction) => {
    const { ok, error: err } = await updateStatus(id, action);
    if (ok) {
      showSuccess(`Ticket marked as ${action === "reopen" ? "open" : "resolved"}.`);
      fetchTickets({
        page, limit: PAGE_SIZE, status: activeTab, category: catFilter, search: debouncedQ, sortBy
      });
    } else {
      showError(err || `Failed to ${action} ticket.`);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex flex-col gap-6 w-full max-w-full overflow-x-hidden relative">
      <TicketsHeader 
        loading={loading}
        onRefresh={() => fetchTickets({
          page, limit: PAGE_SIZE, status: activeTab, category: catFilter, search: debouncedQ, sortBy
        })} 
        onCreate={() => setShowCreate(true)}
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1400px] mx-auto min-h-0">
        <TicketNavSidebar
          counts={{...counts, deleted: 0}}
          activeStatus={activeTab}
          onStatusChange={setActiveTab}
          loading={loading}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors">
              <Search className="h-4 w-4 shrink-0" />
              <input 
                type="text" 
                placeholder="Search your tickets..." 
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[13px] placeholder:text-[#505050]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button onClick={() => setQ("")} className="shrink-0 p-1 hover:text-white transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2 shrink-0">
              <TicketCategoryFilter
                categories={categories}
                value={catFilter}
                onChange={setCatFilter}
              />
              <TicketSort value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* List Area */}
          {loading ? (
            <div className="w-full">
              <TicketsSkeleton count={6} />
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              {tickets.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {tickets.map(t => (
                    <TicketItem 
                      key={t._id} 
                      ticket={t} 
                      onAction={(action) => onAction(t._id, action)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#141414] rounded-[10px] border border-[#282828]">
                  <MessageSquare className="h-10 w-10 text-[#505050] mb-4 opacity-50" />
                  <h3 className="text-[15px] font-medium text-[#d5d5d5] mb-2">
                    {debouncedQ ? "No matches found" : "No tickets found"}
                  </h3>
                  <p className="text-[#888] text-[13px] max-w-[300px]">
                    {debouncedQ 
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "You haven't opened any tickets in this category yet."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <TicketPagination 
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      <CreateTicketDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        title={createTitle}
        setTitle={setCreateTitle}
        message={createMessage}
        setMessage={setCreateMessage}
        category={createCategory}
        setCategory={setCreateCategory}
        priority={createPriority}
        setPriority={setCreatePriority}
        categories={categories}
        loading={creating}
        onSubmit={handleCreate}
      />
    </div>
  );
}
