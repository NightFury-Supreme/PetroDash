'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ChevronDown, Check } from 'lucide-react';

interface TicketSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function TicketSort({ sortBy, setSortBy }: TicketSortProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={sortRef}>
      <button
        onClick={() => setSortOpen(!sortOpen)}
        className={`h-[42px] min-w-[100px] flex items-center justify-center gap-[7px] px-[11px] border rounded-md text-[10px] text-[#858585] transition-colors
          ${sortOpen ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#1A1A1A] border-transparent hover:bg-[#222] hover:text-[#ddd]'}
        `}
      >
        <ArrowUpDown size={14} />
        Sort
        <ChevronDown size={12} />
      </button>

      {sortOpen && (
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[210px] border border-[#222] rounded-md bg-[#151515] p-2 shadow-xl">
          <div className="px-2 pb-2 pt-1">
            <span className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Sort Tickets</span>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { label: 'Updated · Newest', value: 'updated_desc' },
              { label: 'Updated · Oldest', value: 'updated_asc' },
              { label: 'Created · Newest', value: 'created_desc' },
              { label: 'Created · Oldest', value: 'created_asc' },
              { label: 'Priority · High first', value: 'priority_desc' },
              { label: 'Priority · Low first', value: 'priority_asc' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => { setSortBy(option.value); setSortOpen(false); }}
                className={`flex items-center justify-between w-full px-2 py-2 rounded-md text-[11px] transition-colors
                  ${sortBy === option.value ? 'text-[#ff5722]' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
                `}
              >
                <span>{option.label}</span>
                {sortBy === option.value && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
