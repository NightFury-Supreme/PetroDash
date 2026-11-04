'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LogFilters } from '@/hooks/admin/logs';

interface AdminLogsFiltersProps {
  filters: LogFilters;
  onFilterChange: (key: keyof LogFilters, value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function AdminLogsFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  loading,
}: AdminLogsFiltersProps) {
  const t = useTranslations('AdminLogs');
  const tActivity = useTranslations('ActivityLog');
  const [searchTerm, setSearchTerm] = useState(filters.q || '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(filters.q || '');
  }, [filters.q]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.q || '')) {
        onSearchChange(searchTerm);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange, filters.q]);

  const actionOptions = [
    { value: '', label: t('allActions') },
    { value: 'server.create', label: t('serverCreated') },
    { value: 'server.update', label: t('serverUpdated') },
    { value: 'server.delete', label: t('serverDeleted') },
    { value: 'user.update', label: t('userUpdated') },
    { value: 'user.delete', label: t('userDeleted') },
    { value: 'payment.purchase.completed', label: t('planPurchased') },
    { value: 'shop.purchase', label: t('shopItemPurchased') },
    { value: 'admin.user.update', label: t('adminUserUpdate') },
    { value: 'admin.user.ban', label: tActivity('admin.user.ban') },
    { value: 'admin.user.unban', label: tActivity('admin.user.unban') },
    { value: 'admin.server.update', label: t('adminServerUpdate') },
    { value: 'admin.server.transfer', label: tActivity('admin.server.transfer') },
    { value: 'admin.server.sync_egg', label: tActivity('admin.server.sync_egg') },
    { value: 'admin.server.sync_limits', label: tActivity('admin.server.sync_limits') },
    { value: 'admin.server.sync_location', label: tActivity('admin.server.sync_location') },
    { value: 'admin.server.sync_name', label: tActivity('admin.server.sync_name') },
    { value: 'admin.server.suspend', label: tActivity('admin.server.suspend') },
    { value: 'admin.server.unsuspend', label: tActivity('admin.server.unsuspend') },
    { value: 'auth.login', label: t('userLogin') },
    { value: 'auth.logout', label: t('userLogout') },
    { value: 'auth.register', label: t('userRegistration') },
    { value: 'oauth.discord', label: t('discordLogin') },
    { value: 'oauth.google', label: t('googleLogin') },
  ];

  const resourceTypeOptions = [
    { value: '', label: t('allResources') },
    { value: 'server', label: t('server') },
    { value: 'user', label: t('user') },
    { value: 'plan', label: t('plan') },
    { value: 'payment', label: t('payment') },
    { value: 'shop', label: t('shop') },
    { value: 'auth', label: t('authentication') },
    { value: 'admin', label: t('admin') },
  ];

  const severityOptions = [
    { value: '', label: t('allSeverities') },
    { value: 'INFO', label: t('info') },
    { value: 'WARNING', label: t('warning') },
    { value: 'ERROR', label: t('error') },
    { value: 'CRITICAL', label: t('critical') },
  ];

  const activeFilterCount = [
    filters.action !== '',
    filters.resourceType !== '',
    filters.severity !== '',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] mt-[25px]">
      <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
        <Search size={15} />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
          className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onSearchChange('');
            }}
            className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
            aria-label={t('clearSearch')}
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
            <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-[420px] max-w-[calc(100vw-36px)] sm:max-w-none rounded-lg border border-[#282828] bg-[#121212] p-1 shadow-xl">
              <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
                <strong className="text-[#ddd] text-xs font-semibold mb-[2px]">{t('filters')}</strong>
                <span className="text-[#666] text-[10px]">{t('filtersDescription')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px] p-3">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('action')}</label>
                  <SelectDropdown
                    value={filters.action}
                    options={actionOptions}
                    onChange={(val) => onFilterChange('action', val)}
                    className="w-full"
                    buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                    menuClassName="bg-[#161616] border border-[#282828] max-h-[180px]"
                  />
                </div>

                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('resource')}</label>
                  <SelectDropdown
                    value={filters.resourceType}
                    options={resourceTypeOptions}
                    onChange={(val) => onFilterChange('resourceType', val)}
                    className="w-full"
                    buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                    menuClassName="bg-[#161616] border border-[#282828]"
                  />
                </div>

                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[9px] font-semibold uppercase tracking-[0.7px]">{t('severity')}</label>
                  <SelectDropdown
                    value={filters.severity}
                    options={severityOptions}
                    onChange={(val) => onFilterChange('severity', val)}
                    className="w-full"
                    buttonClassName="h-8 text-xs bg-[#161616] border border-[#282828] text-[#D4D4D4] hover:bg-[#1A1A1A] hover:border-[#383838]"
                    menuClassName="bg-[#161616] border border-[#282828]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-3 py-2.5 border-t border-[#222]">
                <button
                  type="button"
                  onClick={onClearFilters}
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
      </div>
    </div>
  );
}

export default AdminLogsFilters;
