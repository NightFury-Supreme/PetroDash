import React from "react";
import { HardDrive, MemoryStick, Cpu, Save, Database, Network, ChevronUp, ChevronDown } from "lucide-react";

export type ResourceKey = "diskMb" | "memoryMb" | "cpuPercent" | "backups" | "databases" | "allocations";

export interface ResourceField {
  key: ResourceKey;
  label: string;
  icon: typeof HardDrive;
  unit: string;
}

export const RESOURCE_FIELDS: ResourceField[] = [
  { key: "diskMb", label: "Disk Storage", icon: HardDrive, unit: "MB" },
  { key: "memoryMb", label: "Memory", icon: MemoryStick, unit: "MB" },
  { key: "cpuPercent", label: "CPU", icon: Cpu, unit: "%" },
  { key: "backups", label: "Backups", icon: Save, unit: "" },
  { key: "databases", label: "Databases", icon: Database, unit: "" },
  { key: "allocations", label: "Allocations", icon: Network, unit: "" },
];

export const UsageBar = React.memo(function UsageBar({ value, available, exceeds }: { value: number; available: number; exceeds: boolean }) {
  const total = value + available;
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  const segments = 40;
  const filled = Math.round((pct / 100) * segments);

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-[2px] ${i < filled ? (exceeds ? "bg-red-500" : "bg-[#FF5722]") : "bg-[#222]"}`}
          />
        ))}
      </div>
      <span className={`text-xs tabular-nums w-8 text-right ${exceeds ? 'text-red-400 font-semibold' : 'text-[#888] font-medium'}`}>
        {Math.round(pct)}%
      </span>
    </div>
  );
});

export const ResourceInputCard = React.memo(function ResourceInputCard({
  field,
  value,
  remaining,
  violation,
  isExceeding,
  updateValue
}: {
  field: ResourceField;
  value: number;
  remaining: number;
  violation?: string;
  isExceeding: boolean;
  updateValue: (key: ResourceKey, v: number) => void;
}) {
  const Icon = field.icon;
  return (
    <div className="relative group">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#D4D4D4]">
          <Icon size={14} className="text-[#888]" />
          {field.label}
        </span>
        <span className="text-xs text-[#888]">
          Available: <span className="text-[#D4D4D4] font-medium">{remaining.toLocaleString()}</span>
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          value={value === 0 && !value.toString() ? '' : value}
          onChange={(e) => updateValue(field.key, e.target.value === '' ? 0 : Number(e.target.value))}
          className={`w-full rounded-lg border bg-[#161616] pl-4 pr-16 py-2.5 text-sm text-[#D4D4D4] outline-none transition-colors ${
              violation || isExceeding 
                ? 'border-red-500/50 focus:border-red-500' 
                : 'border-[#222] focus:border-[#FF5722]/60'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {field.unit && (
            <span className="pointer-events-none text-xs text-[#888] font-medium mr-1">
              {field.unit}
            </span>
          )}
          <div className="flex flex-col border-l border-[#222] pl-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => updateValue(field.key, (Number(value) || 0) + 1)}
              className="text-[#888] hover:text-[#D4D4D4] transition-colors"
            >
              <ChevronUp size={12} strokeWidth={3} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => updateValue(field.key, Math.max(0, (Number(value) || 0) - 1))}
              className="text-[#888] hover:text-[#D4D4D4] transition-colors -mt-[1px]"
            >
              <ChevronDown size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
      {(violation || isExceeding) && (
        <p className="mt-1.5 text-xs text-red-400">
            {violation || `Exceeds available limit by ${Math.abs(remaining)}`}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between w-full">
        <UsageBar value={Number(value) || 0} available={remaining} exceeds={isExceeding} />
      </div>
    </div>
  );
});
