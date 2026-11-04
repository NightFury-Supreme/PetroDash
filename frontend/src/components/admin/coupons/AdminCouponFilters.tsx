'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, ChevronDown, X } from 'lucide-react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminCouponFiltersProps {
  status: string;
  type: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sort: string;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onFilter: () => void;
  loading?: boolean;
}

export function AdminCouponFilters({
  status,
  type,
  searchQuery,
  setSearchQuery,
  sort,
  onStatusChange,
  onTypeChange,
  onSortChange,
  onFilter,
  loading: _loading,
}: AdminCouponFiltersProps) {
  const t = useTranslations('Admin.coupons');
  const tCommon = useTranslations('Common');
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

  const statusOptions = [
    { value: 'all', label: t('allStatuses') },
    { value: 'active', label: t('statusEnabled') },
    { value: 'disabled', label: t('statusDisabled') },
    { value: 'expired', label: t('statusExpired') },
  ];

  const typeOptions = [
    { value: 'all', label: t('allTypes') },
    { value: 'percentage', label: t('percentage') },
    { value: 'fixed', label: t('fixed') },
  ];

  const sortOptions = [
    { value: 'newest', label: t('sortNewest') },
    { value: 'oldest', label: t('sortOldest') },
    { value: 'value_desc', label: t('sortValueDesc') },
    { value: 'value_asc', label: t('sortValueAsc') },
    { value: 'redemptions_desc', label: t('sortRedemptionsDesc') },
  ];

  const activeFilterCount = (status !== 'all' ? 1 : 0) + (type !== 'all' ? 1 : 0);

  const clearFilters = () => {
    onStatusChange('all');
    onTypeChange('all');
    setTimeout(onFilter, 0);
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
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
                <span className="text-xs text-[#858585] group-hover:text-[#d5d5d5] transition-colors truncate">{tCommon('filters')}</span>
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
              <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[320px] max-w-[calc(100vw-36px)] sm:max-w-none rounded-lg border border-[#282828] bg-[#121212] p-1 shadow-xl">
                <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
                  <strong className="text-[#ddd] text-xs font-semibold mb-[2px]">{tCommon('filters')}</strong>
                  <span className="text-[#666] text-[10px]">{t('narrowDownCoupons')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] p-3">
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('status')}</label>
                    <SelectDropdown
                      value={status}
                      options={statusOptions}
                      onChange={onStatusChange}
                      className="w-full"
                      buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                      menuClassName="bg-[#161616] border border-[#282828]"
                    />
                  </div>

                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('type')}</label>
                    <SelectDropdown
                      value={type}
                      options={typeOptions}
                      onChange={onTypeChange}
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
                    {tCommon('clearFilters')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onFilter();
                    }}
                    className="h-8 px-3.5 rounded-md text-xs font-medium bg-white/10 text-white hover:bg-white/15 transition-colors border border-white/10"
                  >
                    {tCommon('applyFilters')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-[180px]">
            <SelectDropdown
              value={sort}
              options={sortOptions}
              onChange={(v) => {
                onSortChange(v);
                setTimeout(onFilter, 0);
              }}
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

      {activeFilterCount > 0 && (
        <div className="min-h-[38px] flex items-center gap-[6px] flex-wrap pt-2.5">
          <span className="mr-[3px] text-[#444] text-[8px]">{tCommon('activeFilters')}</span>

          {status !== 'all' && (
            <div className="h-[25px] inline-flex items-center gap-[6px] pl-[9px] pr-[7px] border border-[#292929] rounded-[5px] bg-[#141414] text-[#8a8a8a] text-[8px]">
              {t('status')}: {statusOptions.find((o) => o.value === status)?.label || status}
              <button
                type="button"
                onClick={() => {
                  onStatusChange('all');
                  setTimeout(onFilter, 0);
                }}
                className="w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[#555] hover:bg-[#252525] hover:text-[#ddd] transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          )}

          {type !== 'all' && (
            <div className="h-[25px] inline-flex items-center gap-[6px] pl-[9px] pr-[7px] border border-[#292929] rounded-[5px] bg-[#141414] text-[#8a8a8a] text-[8px]">
              {t('type')}: {typeOptions.find((o) => o.value === type)?.label || type}
              <button
                type="button"
                onClick={() => {
                  onTypeChange('all');
                  setTimeout(onFilter, 0);
                }}
                className="w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[#555] hover:bg-[#252525] hover:text-[#ddd] transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="text-[10px] text-[#ff5722] hover:text-[#ff6939] hover:underline ml-2"
          >
            {tCommon('clearAll')}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminCouponFilters;

