'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';
import type { LocationOption, EggOption } from '@/hooks/admin/servers';

interface AdminServerFiltersProps {
  locationFilter: string;
  setLocationFilter: (val: string) => void;
  eggFilter: string;
  setEggFilter: (val: string) => void;
  locations: LocationOption[];
  eggs: EggOption[];
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
  const t = useTranslations('admin.servers');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-[115px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`group flex h-[42px] w-full items-center justify-between gap-1.5 rounded-lg border px-3 text-xs text-[#858585] transition-colors hover:border-[#454545] hover:bg-[#151515] hover:text-[#d5d5d5] focus:outline-none ${
          open ? 'border-[#454545] bg-[#151515] text-[#d5d5d5]' : 'border-[#282828] bg-[#121212]'
        }`}
      >
        <div className="flex items-center gap-[7px] truncate">
          <SlidersHorizontal size={14} className="text-[#858585] shrink-0 group-hover:text-[#d5d5d5] transition-colors" />
          <span className="text-xs text-[#858585] group-hover:text-[#d5d5d5] transition-colors truncate">{t('filters')}</span>
          {activeFilterCount > 0 && (
            <span className="min-w-[17px] h-[17px] inline-flex items-center justify-center px-1 rounded-full bg-white/10 text-white text-[9px] font-bold shrink-0">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-[#858585] shrink-0 transition-transform group-hover:text-white ${open ? 'rotate-180 text-white' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[350px] max-w-[calc(100vw-36px)] sm:max-w-none rounded-lg border border-[#282828] bg-[#121212] p-1 shadow-xl">
          <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
            <strong className="text-[#ddd] text-xs font-semibold mb-[2px]">{t('filters')}</strong>
            <span className="text-[#666] text-[10px]">{t('narrowDown')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] p-3">
            <div className="flex flex-col gap-[7px]">
              <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('node')}</label>
              <SelectDropdown
                value={locationFilter}
                options={[
                  { label: t('allNodes'), value: 'all' },
                  ...locations.map((loc) => ({ label: loc.name, value: loc.id })),
                ]}
                onChange={setLocationFilter}
                className="w-full"
                buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                menuClassName="bg-[#161616] border border-[#282828]"
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('egg')}</label>
              <SelectDropdown
                value={eggFilter}
                options={[
                  { label: t('allEggs'), value: 'all' },
                  ...eggs.map((egg) => ({ label: egg.name, value: egg.id })),
                ]}
                onChange={setEggFilter}
                className="w-full"
                buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                menuClassName="bg-[#161616] border border-[#282828]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-3 py-2.5 border-t border-[#222]">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-[#777] hover:text-[#ddd] transition-colors"
            >
              {t('clearFilters')}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 px-3.5 rounded-md text-xs font-medium bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/10"
            >
              {t('applyFilters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
