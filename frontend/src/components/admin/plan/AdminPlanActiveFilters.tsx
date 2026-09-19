import React from 'react';
import { X } from 'lucide-react';

interface AdminPlanActiveFiltersProps {
  activeFilterCount: number;
  categoryFilter: string;
  removeFilter: (type: 'category') => void;
  clearFilters: () => void;
}

export function AdminPlanActiveFilters({
  activeFilterCount,
  categoryFilter,
  removeFilter,
  clearFilters,
}: AdminPlanActiveFiltersProps) {
  if (activeFilterCount === 0) return null;

  return (
    <div className="min-h-[38px] flex items-center gap-[6px] flex-wrap pt-2.5">
      <span className="mr-[3px] text-[#444] text-[8px]">Active filters</span>
      
      {categoryFilter !== 'all' && (
        <div className="h-[25px] inline-flex items-center gap-[6px] pl-[9px] pr-[7px] border border-[#292929] rounded-[5px] bg-[#141414] text-[#8a8a8a] text-[8px]">
          Category: {categoryFilter}
          <button 
            onClick={() => removeFilter('category')} 
            className="w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[#555] hover:bg-[#252525] hover:text-[#ddd] transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <button 
        onClick={clearFilters}
        className="text-[10px] text-[#ff5722] hover:text-[#ff6939] hover:underline ml-2"
      >
        Clear all
      </button>
    </div>
  );
}
