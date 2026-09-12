import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

function CustomDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeLabel = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-full items-center justify-between gap-2 rounded-md bg-[#1A1A1A] px-3 text-xs text-[#999] transition-colors hover:bg-[#222] hover:text-[#ddd]"
      >
        <span>{activeLabel}</span>
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-9 z-50 rounded-md border border-[#222] bg-[#151515] p-1 shadow-xl max-h-[150px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex h-8 w-full items-center rounded px-2 text-left text-xs transition-colors ${
                opt.value === value
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminEggFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categories: string[];
  activeFilterCount: number;
  clearFilters: () => void;
}

export function AdminEggFilters({
  categoryFilter,
  setCategoryFilter,
  categories,
  activeFilterCount,
  clearFilters,
}: AdminEggFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={filterRef}>
      <button 
        onClick={() => setFiltersOpen(!filtersOpen)}
        className={`h-[42px] min-w-[100px] flex items-center justify-center gap-[7px] px-[11px] border rounded-md text-[10px] text-[#858585] transition-colors
          ${filtersOpen ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#1A1A1A] border-transparent hover:bg-[#222] hover:text-[#ddd]'}
        `}
      >
        <SlidersHorizontal size={14} />
        Filters
        {activeFilterCount > 0 && (
          <span className="min-w-[17px] h-[17px] inline-flex items-center justify-center px-1 rounded-[9px] bg-[#ff5722] text-white text-[8px] font-bold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {filtersOpen && (
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[250px] border border-[#222] rounded-md bg-[#151515] p-1 shadow-xl max-w-[calc(100vw-36px)] sm:max-w-none">
          <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
            <strong className="text-[#ddd] text-[11px] mb-[2px]">Filters</strong>
            <span className="text-[#555] text-[9px]">Narrow down your eggs</span>
          </div>
          
          <div className="flex flex-col gap-[15px] p-[13px]">
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Category</label>
              <CustomDropdown
                value={categoryFilter}
                options={[
                  { label: "All Categories", value: "all" },
                  ...categories.map(c => ({ label: c, value: c }))
                ]}
                onChange={setCategoryFilter}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-[15px] px-3 py-3 border-t border-[#222]">
            <button 
              onClick={clearFilters} 
              className="text-[10px] font-medium text-[#777] hover:text-[#ddd] transition-colors"
            >
              Clear filters
            </button>
            <button 
              onClick={() => setFiltersOpen(false)} 
              className="h-[35px] px-[15px] rounded-md text-[10px] font-semibold bg-[#ff5722] text-white hover:bg-[#ff6939] transition-colors"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
