/* ==========================================================================
   Admin Servers Search & Filter Bar Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { AdminServerFilters } from './AdminServerFilters';
import { AdminServerSort } from './AdminServerSort';
import { AdminServerActiveFilters } from './AdminServerActiveFilters';
import type { LocationOption, EggOption } from '@/hooks/admin/servers';

interface AdminServersSearchFilterBarProps {
  activeTab: 'servers' | 'queue';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  locationFilter: string;
  setLocationFilter: (loc: string) => void;
  eggFilter: string;
  setEggFilter: (egg: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  locations: LocationOption[];
  eggs: EggOption[];
  onOpenClearQueue: () => void;
}

export function AdminServersSearchFilterBar({
  activeTab,
  searchQuery,
  setSearchQuery,
  locationFilter,
  setLocationFilter,
  eggFilter,
  setEggFilter,
  sortBy,
  setSortBy,
  locations,
  eggs,
  onOpenClearQueue,
}: AdminServersSearchFilterBarProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');

  const activeFilterCount = [locationFilter !== 'all', eggFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => {
    setLocationFilter('all');
    setEggFilter('all');
  };
  const removeFilter = (type: 'location' | 'egg') => {
    if (type === 'location') setLocationFilter('all');
    if (type === 'egg') setEggFilter('all');
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
          <Search size={15} />
          <input
            type="text"
            placeholder={activeTab === 'queue' ? t('search.queuePlaceholder') : t('search.serversPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
              aria-label={tCommon('actions.clearSearch')}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <AdminServerFilters
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            eggFilter={eggFilter}
            setEggFilter={setEggFilter}
            locations={locations}
            eggs={eggs}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
          />
          <AdminServerSort sortBy={sortBy} setSortBy={setSortBy} />
          {activeTab === 'queue' && (
            <button
              type="button"
              onClick={onOpenClearQueue}
              className="h-[42px] px-4 flex items-center justify-center rounded-[7px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-medium whitespace-nowrap"
            >
              {t('clearQueueTitle')}
            </button>
          )}
        </div>
      </div>

      <AdminServerActiveFilters
        activeFilterCount={activeFilterCount}
        locationFilter={locationFilter}
        eggFilter={eggFilter}
        locations={locations}
        eggs={eggs}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />
    </div>
  );
}
