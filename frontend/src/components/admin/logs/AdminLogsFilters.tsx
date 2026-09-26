'use client';

import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState(filters.q || '');

  useEffect(() => {
    setSearchTerm(filters.q || '');
  }, [filters.q]);

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
    { value: 'admin.server.update', label: t('adminServerUpdate') },
    { value: 'auth.login', label: t('userLogin') },
    { value: 'auth.logout', label: t('userLogout') },
    { value: 'auth.register', label: t('userRegistration') },
    { value: 'oauth.discord', label: t('discordLogin') },
    { value: 'oauth.google', label: t('googleLogin') }
  ];

  const resourceTypeOptions = [
    { value: '', label: t('allResources') },
    { value: 'server', label: t('server') },
    { value: 'user', label: t('user') },
    { value: 'plan', label: t('plan') },
    { value: 'payment', label: t('payment') },
    { value: 'shop', label: t('shop') },
    { value: 'auth', label: t('authentication') },
    { value: 'admin', label: t('admin') }
  ];

  const severityOptions = [
    { value: '', label: t('allSeverities') },
    { value: 'INFO', label: t('info') },
    { value: 'WARNING', label: t('warning') },
    { value: 'ERROR', label: t('error') },
    { value: 'CRITICAL', label: t('critical') }
  ];


  const activeFilterCount = [
    filters.action !== '', 
    filters.resourceType !== '', 
    filters.severity !== ''
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] mt-[25px]">
        {/* Search Input */}
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
        <div className="w-[110px]">
          <Select
            value=""
            dropdownClassName="w-[450px] right-0 max-w-[calc(100vw-36px)] sm:max-w-none"
            renderButtonContent={() => (
              <div className="flex items-center gap-[7px]">
                <SlidersHorizontal size={14} className="text-[#858585]" />
                <span className="text-[10px] text-[#858585]">{t('filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="min-w-[17px] h-[17px] inline-flex items-center justify-center px-1 rounded-[9px] bg-[#ff5722] text-white text-[8px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            )}
            renderDropdown={({ close }) => (
              <div className="flex flex-col">
                <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
                  <strong className="text-[#ddd] text-[11px] mb-[2px]">{t('filters')}</strong>
                  <span className="text-[#555] text-[9px]">{t('filtersDescription')}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[15px] p-[13px]">
                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">{t('action')}</label>
                    <Select size="sm"
                      value={filters.action}
                      options={actionOptions}
                      onChange={(val) => onFilterChange('action', val)}
                    />
                  </div>

                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">{t('resource')}</label>
                    <Select size="sm"
                      value={filters.resourceType}
                      options={resourceTypeOptions}
                      onChange={(val) => onFilterChange('resourceType', val)}
                    />
                  </div>

                  <div className="flex flex-col gap-[7px]">
                    <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">{t('severity')}</label>
                    <Select size="sm"
                      value={filters.severity}
                      options={severityOptions}
                      onChange={(val) => onFilterChange('severity', val)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-[15px] px-3 py-3 border-t border-[#222]">
                  <button 
                    onClick={onClearFilters} 
                    className="text-[10px] font-medium text-[#777] hover:text-[#ddd] transition-colors"
                  >
                    {t('clearFilters')}
                  </button>
                  <button 
                    onClick={close} 
                    className="h-[35px] px-[15px] rounded-md text-[10px] font-semibold bg-[#ff5722] text-white hover:bg-[#ff6939] transition-colors"
                  >
                    {t('applyFilters')}
                  </button>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
