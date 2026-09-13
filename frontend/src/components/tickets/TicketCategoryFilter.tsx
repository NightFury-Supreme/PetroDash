'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';

interface TicketCategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

export function TicketCategoryFilter({ categories, value, onChange }: TicketCategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`h-[42px] min-w-[100px] flex items-center justify-center gap-[7px] px-[11px] border rounded-md text-[10px] text-[#858585] transition-colors
          ${open ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#1A1A1A] border-transparent hover:bg-[#222] hover:text-[#ddd]'}
        `}
      >
        <Filter size={14} />
        {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : 'All Categories'}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[210px] border border-[#222] rounded-md bg-[#151515] p-2 shadow-xl max-h-[300px] overflow-y-auto">
          <div className="px-2 pb-2 pt-1">
            <span className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Filter Category</span>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className={`flex items-center justify-between w-full px-2 py-2 rounded-md text-[11px] transition-colors
                ${value === "" ? 'text-[#ff5722]' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
              `}
            >
              <span>All Categories</span>
              {value === "" && <Check size={12} />}
            </button>
            {categories.map((option) => (
              <button
                key={option}
                onClick={() => { onChange(option); setOpen(false); }}
                className={`flex items-center justify-between w-full px-2 py-2 rounded-md text-[11px] transition-colors capitalize
                  ${value === option ? 'text-[#ff5722]' : 'text-[#888] hover:bg-[#222] hover:text-[#ddd]'}
                `}
              >
                <span>{option}</span>
                {value === option && <Check size={12} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
