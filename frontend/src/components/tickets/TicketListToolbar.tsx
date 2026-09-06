import React from 'react';
import { Search, X } from 'lucide-react';

interface TicketListToolbarProps {
  title: string;
  description: string;
  search: string;
  onSearchChange: (val: string) => void;
}

export function TicketListToolbar({ title, description, search, onSearchChange }: TicketListToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-[#888888]">{description}</p>
      </div>

      <div className="flex h-8 w-full items-center gap-2 rounded-md border border-[#222] bg-[#161616] px-3 sm:w-52">
        <Search size={12} className="shrink-0 text-[#555]" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tickets."
          className="min-w-0 flex-1 bg-transparent text-xs text-[#CCC] outline-none placeholder:text-[#444]"
        />
        {search && (
          <button type="button" onClick={() => onSearchChange('')} className="shrink-0 text-[#555] hover:text-[#aaa]">
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
