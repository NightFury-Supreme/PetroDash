import { Search, SlidersHorizontal, ArrowDownUp, X } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface AdminLedgerFiltersProps {
  status: string;
  provider: string;
  userId: string;
  sort: string;
  onStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onFilter: () => void;
  loading: boolean;
}

export function AdminLedgerFilters({
  status,
  provider,
  userId,
  sort,
  onStatusChange,
  onProviderChange,
  onUserIdChange,
  onSortChange,
  onFilter,
  loading: _loading
}: AdminLedgerFiltersProps) {
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'CREATED', label: 'Created' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'REFUNDED', label: 'Refunded' },
    { value: 'VOIDED', label: 'Voided' }
  ];

  const providerOptions = [
    { value: '', label: 'All Providers' },
    { value: 'paypal', label: 'PayPal' }
  ];

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: '-amount', label: 'Highest Amount' },
    { value: 'amount', label: 'Lowest Amount' }
  ];

  const activeFilterCount = (status ? 1 : 0) + (provider ? 1 : 0);

  const clearFilters = () => {
    onStatusChange('');
    onProviderChange('');
    setTimeout(onFilter, 0); // Trigger reload after state updates
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by User, Email, Order ID..."
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onFilter()}
            className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
          />
        </div>
        
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="w-[150px]">
            <Select
              value={sort}
              options={sortOptions}
              onChange={(v) => { onSortChange(v); setTimeout(onFilter, 0); }}
              renderButtonContent={(label) => (
                <div className="flex items-center gap-[7px]">
                  <ArrowDownUp size={14} className="text-[#858585]" />
                  <span className="text-[10px] text-[#858585]">{label}</span>
                </div>
              )}
            />
          </div>

          <div className="w-[110px]">
            <Select
              value=""
              dropdownClassName="w-[250px] right-0 max-w-[calc(100vw-36px)] sm:max-w-none"
              renderButtonContent={() => (
                <div className="flex items-center gap-[7px]">
                  <SlidersHorizontal size={14} className="text-[#858585]" />
                  <span className="text-[10px] text-[#858585]">Filters</span>
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
                    <strong className="text-[#ddd] text-[11px] mb-[2px]">Filters</strong>
                    <span className="text-[#555] text-[9px]">Narrow down transactions</span>
                  </div>
                  
                  <div className="flex flex-col gap-[15px] p-[13px]">
                    <div className="flex flex-col gap-[7px]">
                      <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Status</label>
                      <Select size="sm"
                        value={status}
                        options={statusOptions}
                        onChange={onStatusChange}
                      />
                    </div>
                    <div className="flex flex-col gap-[7px]">
                      <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">Provider</label>
                      <Select size="sm"
                        value={provider}
                        options={providerOptions}
                        onChange={onProviderChange}
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
                      onClick={() => { close(); onFilter(); }} 
                      className="h-[35px] px-[15px] rounded-md text-[10px] font-semibold bg-[#ff5722] text-white hover:bg-[#ff6939] transition-colors"
                    >
                      Apply filters
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="min-h-[38px] flex items-center gap-[6px] flex-wrap pt-1">
          <span className="mr-[3px] text-[#444] text-[10px] font-semibold uppercase tracking-[0.6px]">Active:</span>
          {status && (
            <div className="h-[28px] flex items-center gap-[7px] pl-[9px] pr-[5px] rounded-[5px] bg-[#1a1a1a] border border-[#222]">
              <span className="text-[#888] text-[9px] font-medium">
                Status: <span className="text-[#ccc]">{statusOptions.find(o => o.value === status)?.label}</span>
              </span>
              <button 
                onClick={() => { onStatusChange(''); setTimeout(onFilter, 0); }}
                className="w-[18px] h-[18px] flex items-center justify-center rounded-[3px] hover:bg-[#333] text-[#666] hover:text-[#ddd] transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          )}
          {provider && (
            <div className="h-[28px] flex items-center gap-[7px] pl-[9px] pr-[5px] rounded-[5px] bg-[#1a1a1a] border border-[#222]">
              <span className="text-[#888] text-[9px] font-medium">
                Provider: <span className="text-[#ccc]">{providerOptions.find(o => o.value === provider)?.label}</span>
              </span>
              <button 
                onClick={() => { onProviderChange(''); setTimeout(onFilter, 0); }}
                className="w-[18px] h-[18px] flex items-center justify-center rounded-[3px] hover:bg-[#333] text-[#666] hover:text-[#ddd] transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
