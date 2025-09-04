interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

interface ResourceInputProps {
  resourceKey: keyof ResourceLimits;
  label: string;
  unit: string;
  min: number;
  icon: string;
  value: number;
  remaining: number;
  exceeds: boolean;
  violation?: string;
  onChange: (value: number) => void;
}

export function ResourceInput({
  resourceKey,
  label,
  unit,
  min,
  icon,
  value,
  remaining,
  exceeds,
  violation,
  onChange
}: ResourceInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <i className={`${icon} text-gray-400`}></i>
          {label}
        </label>
        <span className="text-xs text-gray-400">
          Available: {Number(remaining || 0).toLocaleString()}
        </span>
      </div>
      <input
        type="number"
        min={min}
        value={Number(value)}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        className={`w-full bg-[#181818] border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-blue-500 transition-colors ${
          exceeds 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-[#404040] focus:border-blue-500'
        }`}
        placeholder={`Min: ${min}`}
      />
      {violation && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="fas fa-exclamation-triangle"></i>
          {violation}
        </p>
      )}
      {exceeds && !violation && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="fas fa-exclamation-triangle"></i>
          Exceeds available resources
        </p>
      )}
    </div>
  );
}

