import { Edit2, Trash2, Users } from "lucide-react";

export function AdminGiftTableRow({
  gift,
  onEdit,
  onDelete,
  onRedemptions,
  cols,
}: {
  gift: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRedemptions: (id: string) => void;
  cols: string;
}) {
  const getRewardsText = () => {
    const parts = [];
    if (gift.rewards?.coins) parts.push(`${gift.rewards.coins} coins`);
    if (gift.rewards?.resources?.cpuPercent) parts.push(`${gift.rewards.resources.cpuPercent}% CPU`);
    if (gift.rewards?.resources?.memoryMb) parts.push(`${gift.rewards.resources.memoryMb}MB RAM`);
    if (gift.rewards?.resources?.diskMb) parts.push(`${gift.rewards.resources.diskMb}MB Disk`);
    if (gift.rewards?.resources?.serverSlots) parts.push(`${gift.rewards.resources.serverSlots} Slots`);
    return parts.join(", ") || "No rewards";
  };

  const isExpired = gift.validUntil && new Date(gift.validUntil) < new Date();
  
  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      {/* Code */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Code</p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">{gift.code}</span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">{gift.source === "user" ? "User Generated" : "System Gift"}</span>
      </div>

      {/* Rewards */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Rewards</p>
        <span className="truncate text-sm text-[#AAAAAA]">{getRewardsText()}</span>
      </div>

      {/* Uses */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Uses</p>
        <span className="text-sm text-[#AAAAAA]">{gift.redeemedCount || 0} / {gift.maxRedemptions || "∞"}</span>
      </div>

      {/* Valid Until */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Expires</p>
        <span className="text-sm text-[#AAAAAA]">
          {gift.validUntil ? new Date(gift.validUntil).toLocaleDateString() : "Never"}
        </span>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Status</p>
        {isExpired ? (
          <span className="inline-flex items-center px-2 py-1 rounded bg-[#222] text-[#888] text-[10px] font-medium tracking-wide uppercase border border-[#333]">Expired</span>
        ) : gift.enabled ? (
          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">Enabled</span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">Disabled</span>
        )}
      </div>

      {/* Actions */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <button
            onClick={() => onRedemptions(gift._id)}
            title="View redemptions"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors"
          >
            <Users size={14} />
          </button>
          <button
            onClick={() => onEdit(gift._id)}
            title="Edit gift"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(gift._id)}
            title="Delete gift"
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
