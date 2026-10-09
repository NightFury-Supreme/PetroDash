import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, X,  } from 'lucide-react';

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

interface AdminLogsFiltersProps {
  filters: {
    action: string;
    actorId: string;
    resourceType: string;
    requestId: string;
    severity: string;
  };
  onFilterChange: (key: 'action' | 'actorId' | 'resourceType' | 'requestId' | 'severity', value: string) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function AdminLogsFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  loading
}: AdminLogsFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'server.create', label: 'Server Created' },
    { value: 'server.update', label: 'Server Updated' },
    { value: 'server.delete', label: 'Server Deleted' },
    { value: 'user.update', label: 'User Updated' },
    { value: 'user.delete', label: 'User Deleted' },
    { value: 'payment.purchase.completed', label: 'Plan Purchased' },
    { value: 'shop.purchase', label: 'Shop Item Purchased' },
    { value: 'admin.user.update', label: 'Admin User Update' },
    { value: 'admin.server.update', label: 'Admin Server Update' },
    { value: 'auth.login', label: 'User Login' },
    { value: 'auth.logout', label: 'User Logout' },
    { value: 'auth.register', label: 'User Registration' },
    { value: 'oauth.discord', label: 'Discord Login' },
    { value: 'oauth.google', label: 'Google Login' }
  ];

  const resourceTypeOptions = [
    { value: '', label: 'All Resources' },
    { value: 'server', label: 'Server' },
    { value: 'user', label: 'User' },
    { value: 'plan', label: 'Plan' },
    { value: 'payment', label: 'Payment' },
    { value: 'shop', label: 'Shop' },
    { value: 'auth', label: 'Authentication' },
    { value: 'admin', label: 'Admin' }
  ];

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'INFO', label: 'Info' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'ERROR', label: 'Error' },
    { value: 'CRITICAL', label: 'Critical' }
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
            placeholder="Search by User ID or Request ID..."
            value={filters.actorId || filters.requestId}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={loading}
            className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
          />
          {(filters.actorId || filters.requestId) && (
            <button
              onClick={() => onSearchChange('')}
              className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

      <div className="flex items-center gap-[7px] w-full sm:w-auto">
        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            disabled={loading}
            className={`h-[42px] min-w-[100px] flex items-center justify-center gap-[7px] px-[11px] border rounded-md text-[10px] text-[#858585] transition-colors
              ${filtersOpen ? 'bg-[#222] border-[#222] text-[#ddd]' : 'bg-[#1A1A1A] border-transparent hover:bg-[#222] hover:text-[#ddd]'}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
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
            <div className="absolute z-50 top-[calc(100%+8px)] right-0 w-[450px] border border-[#222] rounded-md bg-[#151515] p-1 shadow-xl max-w-[calc(100vw-36px)] sm:max-w-none">
              <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
                <strong className="text-[#ddd] text-[11px] mb-[2px]">Filters</strong>
                <span className="text-[#555] text-[9px]">Narrow down your audit logs</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[15px] p-[13px]">
                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Action</label>
                  <CustomDropdown
                    value={filters.action}
                    options={actionOptions}
                    onChange={(val) => onFilterChange('action', val)}
                  />
                </div>

                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Resource</label>
                  <CustomDropdown
                    value={filters.resourceType}
                    options={resourceTypeOptions}
                    onChange={(val) => onFilterChange('resourceType', val)}
                  />
                </div>

                <div className="flex flex-col gap-[7px]">
                  <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Severity</label>
                  <CustomDropdown
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
      </div>
    </div>
  );
}
