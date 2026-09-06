'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useTickets } from '@/hooks/useTickets';
import { TicketNavSidebar } from '@/components/tickets/TicketNavSidebar';
import { TicketRowItem } from '@/components/tickets/TicketRowItem';
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal';
import { TicketEmptyState } from '@/components/tickets/TicketEmptyState';
import { TicketsSkeleton } from '@/components/tickets/TicketsSkeleton';
import { TicketPageHeader } from '@/components/tickets/TicketPageHeader';
import { TicketListToolbar } from '@/components/tickets/TicketListToolbar';
import { TicketListHeader } from '@/components/tickets/TicketListHeader';
import { TicketAction, TicketStatus } from '@/components/tickets/types';
import { getStatusTitle, getStatusDescription } from '@/components/tickets/utils';

export default function TicketsPage() {
  const router = useRouter();
  const { tickets, loading, categories, fetchTickets, updateStatus, createTicket } = useTickets();

  /* -- Filter state --------------------------------- */
  const [activeStatus, setActiveStatus] = useState<TicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  /* -- Row menu state ------------------------------- */
  const [menuTicket, setMenuTicket] = useState<string | null>(null);



  /* -- Create modal --------------------------------- */
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [createCategory, setCreateCategory] = useState('general');
  const [createPriority, setCreatePriority] = useState('low');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  /* -- Close menu on outside click ----------------- */
  useEffect(() => {
    if (!menuTicket) return;
    const h = () => setMenuTicket(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [menuTicket]);

  /* -- Counts --------------------------------------- */
  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }), [tickets]);

  /* -- Filtered list -------------------------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(t => {
      const matchStatus = activeStatus === 'all' || t.status === activeStatus;
      const matchSearch = !q ||
        t._id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [tickets, activeStatus, search]);

  /* -- Handlers ------------------------------------- */
  const handleStatus = useCallback(async (id: string, action: TicketAction) => {
    await updateStatus(id, action);
  }, [updateStatus]);

  /* -- Create --------------------------------------- */
  const handleCreate = useCallback(async () => {
    setCreateError(null);
    if (!createTitle.trim()) { setCreateError('Subject is required'); return; }
    if (createMessage.trim().length < 3) { setCreateError('Message must be at least 3 characters'); return; }
    setCreating(true);
    const result = await createTicket({ title: createTitle, message: createMessage, category: createCategory, priority: createPriority });
    if (result.ok) {
      setCreateSuccess(true);
      setTimeout(() => {
        setShowCreate(false);
        setCreateSuccess(false);
        setCreateTitle(''); setCreateMessage(''); setCreateCategory(categories[0] || 'general'); setCreatePriority('low');
      }, 1500);
    } else {
      setCreateError(result.error || 'Failed to create ticket');
    }
    setCreating(false);
  }, [createTitle, createMessage, createCategory, createPriority, categories, createTicket]);

  const openCreate = useCallback(() => {
    setCreateError(null);
    setCreateTitle(''); setCreateMessage(''); setCreateCategory(categories[0] || 'general'); setCreatePriority('low');
    setShowCreate(true);
  }, [categories]);

  const hasFilters = !!search || activeStatus !== 'all';

  if (loading && tickets.length === 0) {
    return (
      <TicketsSkeleton />
    );
  }

  /* -- Render --------------------------------------- */
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">

      {/* -- Page header -- */}
      <TicketPageHeader loading={loading} onRefresh={() => fetchTickets()} onCreate={openCreate} />

      {/* -- Two-column layout (matches profile exactly) -- */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* -- Left nav ------------------------------------ */}
        <TicketNavSidebar active={activeStatus} counts={counts} onSelect={setActiveStatus} />

        {/* -- Content area -------------------------------- */}
        <div className="flex-1 min-w-0 w-full">

          {/* Section heading & Search */}
          <TicketListToolbar 
            title={getStatusTitle(activeStatus)} 
            description={getStatusDescription(activeStatus)} 
            search={search} 
            onSearchChange={setSearch} 
          />

          {/* Table column headers */}
          {filtered.length > 0 && <TicketListHeader />}

          {/* List */}
          {filtered.length === 0 ? (
            <TicketEmptyState
              hasFilters={hasFilters}
              onClear={() => { setSearch(''); setActiveStatus('all'); }}
              onCreate={openCreate}
            />
          ) : (
            filtered.map(ticket => (
              <TicketRowItem
                key={ticket._id}
                ticket={ticket}
                menuOpen={menuTicket === ticket._id}
                onOpen={() => router.push(`/tickets/${ticket._id}`)}
                onMenu={e => { e.stopPropagation(); setMenuTicket(menuTicket === ticket._id ? null : ticket._id); }}
                onStatus={action => handleStatus(ticket._id, action)}
              />
            ))
          )}
        </div>
      </div>



      {/* -- Create modal -------------------------------- */}
      {showCreate && (
        <CreateTicketModal
          title={createTitle}
          message={createMessage}
          category={createCategory}
          priority={createPriority}
          categories={categories}
          error={createError}
          creating={creating}
          success={createSuccess}
          onTitleChange={setCreateTitle}
          onMessageChange={setCreateMessage}
          onCategoryChange={setCreateCategory}
          onPriorityChange={setCreatePriority}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
    </div>
  );
}
