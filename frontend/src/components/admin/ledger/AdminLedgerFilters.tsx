interface AdminLedgerFiltersProps {
  status: string;
  provider: string;
  userId: string;
  onStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onFilter: () => void;
  loading: boolean;
}

export function AdminLedgerFilters({
  status,
  provider,
  userId,
  onStatusChange,
  onProviderChange,
  onUserIdChange,
  onFilter,
  loading
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <select
        className="h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white focus:border-[#404040] focus:outline-none transition-colors"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#202020] text-white">
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white focus:border-[#404040] focus:outline-none transition-colors"
        value={provider}
        onChange={(e) => onProviderChange(e.target.value)}
      >
        {providerOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#202020] text-white">
            {option.label}
          </option>
        ))}
      </select>

      <input
        className="h-12 bg-[#202020] border border-[#303030] rounded-lg px-4 text-white placeholder-[#AAAAAA] focus:border-[#404040] focus:outline-none transition-colors"
        placeholder="User ID"
        value={userId}
        onChange={(e) => onUserIdChange(e.target.value)}
      />
      <button
        className="h-12 bg-[#202020] hover:bg-[#272727] border border-[#303030] hover:border-[#404040] rounded-lg px-6 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onFilter}
        disabled={loading}
      >
        {loading ? (
          <><i className="fas fa-spinner fa-spin mr-2"></i>Loading...</>
        ) : (
          <><i className="fas fa-filter mr-2"></i>Filter</>
        )}
      </button>
    </div>
  );
}
