import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

interface AdminGiftSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminGiftSort({ sortBy, setSortBy }: AdminGiftSortProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      </button>

      {sortOpen && (
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[180px] border border-[#222] rounded-md bg-[#151515] p-1 shadow-xl">
          <div className="flex flex-col">
            {[
              { id: 'newest', label: 'Newest first' },
              { id: 'oldest', label: 'Oldest first' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setSortBy(option.id);
                  setSortOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-[10px] rounded hover:bg-white/5 transition-colors ${
                  sortBy === option.id ? 'text-white bg-white/[0.02]' : 'text-[#888]'
                }`}
              >
                {option.label}
                {sortBy === option.id && <Check size={12} className="text-[#ff5722]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
