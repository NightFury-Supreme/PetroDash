import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownUp, ChevronDown } from 'lucide-react';

interface AdminLogsSortProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  loading: boolean;
}

export function AdminLogsSort({ sortBy, setSortBy, loading }: AdminLogsSortProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
  ];

  const activeLabel = options.find((o) => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`h-[42px] min-w-[120px] flex items-center justify-between gap-[7px] px-[13px] border rounded-md text-[10px] text-[#858585] transition-colors
          ${open ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#121212] border-[#282828] hover:bg-[#222] hover:text-[#ddd]'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-[7px]">
          <ArrowDownUp size={14} />
          <span>{activeLabel}</span>
        </div>
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[180px] border border-[#222] rounded-md bg-[#151515] p-1 shadow-xl">
          <div className="flex flex-col">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSortBy(opt.value);
                  setOpen(false);
                }}
                className={`flex h-8 w-full items-center rounded px-3 text-left text-xs transition-colors ${
                  opt.value === sortBy
                    ? "bg-white/10 text-white"
                    : "text-[#888] hover:bg-white/10 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
