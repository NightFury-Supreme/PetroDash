import { Edit2 } from "lucide-react";

export interface EarnMethodRowProps {
  methodName: string;
  methodSubtitle: string;
  description: string;
  rewardStr: string;
  limitStr: string;
  enabled: boolean;
  cols: string;
  onEdit: () => void;
}

export function EarnMethodRow({
  methodName,
  methodSubtitle,
  description,
  rewardStr,
  limitStr,
  enabled,
  cols,
  onEdit,
}: EarnMethodRowProps) {
  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      {/* Method Name */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Method</p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">
          {methodName}
        </span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
          {methodSubtitle}
        </span>
      </div>

      {/* Description */}
      <div className="min-w-0 hidden lg:block">
        <span className="truncate text-sm text-[#AAAAAA]">{description}</span>
      </div>

      {/* Reward */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Reward</p>
        <span className="text-sm text-[#AAAAAA]">{rewardStr}</span>
      </div>

      {/* Limit */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Daily Limit</p>
        <span className="text-sm text-[#AAAAAA]">{limitStr}</span>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Status</p>
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
        )}
      </div>

      {/* Actions */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <button
            onClick={onEdit}
            title="Configure method"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
