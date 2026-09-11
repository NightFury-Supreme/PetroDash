import { Search, SlidersHorizontal, User, Filter, X, Loader2 } from 'lucide-react';

interface AdminLogsFiltersProps {
  filters: {
    action: string;
    actorId: string;
    resourceType: string;
  };
  onFilterChange: (key: 'action' | 'actorId' | 'resourceType', value: string) => void;
  onClearFilters: () => void;
  loading: boolean;
}

export function AdminLogsFilters({
  filters,
  onFilterChange,
  onClearFilters,
  loading
}: AdminLogsFiltersProps) {
  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'server.create', label: 'Server Created' },
    { value: 'server.update', label: 'Server Updated' },
    { value: 'server.delete', label: 'Server Deleted' },
    { value: 'user.update', label: 'User Updated' },
    { value: 'user.delete', label: 'User Deleted' },
    { value: 'payment.purchase.completed', label: 'Plan Purchased' },
    { value: 'shop.purchase.completed', label: 'Shop Item Purchased' },
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

  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] mt-[25px]">
      <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
        <Filter size={15} />
        <select
          className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] appearance-none"
          value={filters.action}
          onChange={(e) => onFilterChange('action', e.target.value)}
          disabled={loading}
        >
          {actionOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#121212] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
        <Search size={15} />
        <input
          type="text"
          placeholder="Filter by user ID..."
          value={filters.actorId}
          onChange={(e) => onFilterChange('actorId', e.target.value)}
          disabled={loading}
          className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
        />
      </div>

      <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
        <SlidersHorizontal size={15} />
        <select
          className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] appearance-none"
          value={filters.resourceType}
          onChange={(e) => onFilterChange('resourceType', e.target.value)}
          disabled={loading}
        >
          {resourceTypeOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#121212] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onClearFilters}
        disabled={loading}
        className="h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center rounded-[7px] border border-[#282828] bg-[#121212] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors disabled:opacity-50"
        aria-label="Clear filters"
        title="Clear filters"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
      </button>
    </div>
  );
}
