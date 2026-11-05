'use client';

import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { AdminPlanFilters } from './AdminPlanFilters';
import { useTranslations } from 'next-intl';

interface AdminPlansSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
  categories: string[];
  activeFilterCount: number;
  clearFilters: () => void;
}

export function AdminPlansSearchBar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  categories,
  activeFilterCount,
  clearFilters,
}: AdminPlansSearchBarProps) {
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');

  const sortOptions = [
    { value: 'newest', label: t('sortNewest') },
    { value: 'oldest', label: t('sortOldest') },
    { value: 'name_asc', label: t('sortNameAsc') },
    { value: 'name_desc', label: t('sortNameDesc') },
    { value: 'price_desc', label: t('sortPriceDesc') },
    { value: 'price_asc', label: t('sortPriceAsc') },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
      <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
        <Search size={15} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
            aria-label={tCommon('clearSearch')}
          >
            <X size={13} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-[7px] w-full sm:w-auto">
        <AdminPlanFilters
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categories={categories}
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
        />
        <div className="w-[180px]">
          <SelectDropdown
            value={sort}
            options={sortOptions}
            onChange={setSort}
            className="w-full"
            buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
            menuClassName="bg-[#121212] border border-[#282828]"
            placeholder={tCommon('sort')}
            renderSelected={(opt) => (
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown size={14} className="text-[#858585] shrink-0" />
                <span className="truncate">{opt?.label ?? tCommon('sort')}</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminPlansSearchBar;

