import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface TicketPageHeaderProps {
  loading?: boolean;
  onRefresh: () => void;
  onCreate: () => void;
}

export function TicketPageHeader({ loading, onRefresh, onCreate }: TicketPageHeaderProps) {
  return (
    <header>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Support Tickets</h1>
          <p className="text-[#888888] mt-1 text-sm">Create and manage your support requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className={`flex h-8 w-8 items-center justify-center rounded-md border border-[#222] bg-[#161616] transition-colors ${loading ? 'text-white cursor-not-allowed' : 'text-[#888] hover:text-white'}`}
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-[#FF5722]/30 bg-[#1A0F0C] px-4 text-xs font-medium text-[#FF5722] transition-colors hover:bg-[#FF5722]/10"
          >
            <Plus size={13} />
            New Ticket
          </button>
        </div>
      </div>
    </header>
  );
}
