import React, { useState, useRef, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

interface AdminServerFiltersProps {
  locationFilter: string;
  setLocationFilter: (val: string) => void;
  eggFilter: string;
  setEggFilter: (val: string) => void;
  locations: { _id: string; name: string }[];
  eggs: { _id: string; name: string }[];
  activeFilterCount: number;
  clearFilters: () => void;
}

export function AdminServerFilters({
  locationFilter,
  setLocationFilter,
  eggFilter,
  setEggFilter,
  locations,
  eggs,
  activeFilterCount,
  clearFilters,
}: AdminServerFiltersProps) {
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
        <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[350px] border border-[#222] rounded-md bg-[#151515] p-1 shadow-xl max-w-[calc(100vw-36px)] sm:max-w-none">
          <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
            <strong className="text-[#ddd] text-[11px] mb-[2px]">Filters</strong>
            <span className="text-[#555] text-[9px]">Narrow down your servers</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] p-[13px]">
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Node</label>
              <Select size="sm"
                value={locationFilter}
                options={[
                  { label: "All Nodes", value: "all" },
                  ...locations.map(loc => ({ label: loc.name, value: loc._id }))
                ]}
                onChange={setLocationFilter}
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Egg</label>
              <Select size="sm"
                value={eggFilter}
                options={[
                  { label: "All Eggs", value: "all" },
                  ...eggs.map(egg => ({ label: egg.name, value: egg._id }))
                ]}
                onChange={setEggFilter}
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
