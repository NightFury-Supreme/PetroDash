import React from 'react';
import { Ticket } from 'lucide-react';

interface TicketEmptyStateProps {
  hasFilters: boolean;
  onClear:   () => void;
  onCreate:  () => void;
}

export function TicketEmptyState({ hasFilters, onClear, onCreate }: TicketEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]">
        <Ticket size={20} className="text-white/20" />
      </div>
      <p className="text-sm font-semibold text-white/40">
        {hasFilters ? 'No tickets found' : 'No tickets yet'}
      </p>
      <p className="mx-auto mt-1.5 max-w-[260px] text-xs leading-5 text-white/20">
        {hasFilters
          ? 'No tickets match your current search or filter. Try clearing them.'
          : 'You have not opened any support tickets. Create one to get started.'}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-xs text-[#FF5722] transition-colors hover:text-[#FF7043]"
        >
          Clear filters
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-md border border-[#FF5722]/30 bg-[#FF5722]/[0.06] px-4 text-xs font-medium text-[#FF5722] transition-colors hover:bg-[#FF5722]/10"
        >
          <span className="text-sm leading-none">+</span> New Ticket
        </button>
      )}
    </div>
  );
}
