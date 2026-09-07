import { Edit2, Trash2, Users, Coins, Cpu, MemoryStick, HardDrive, Server } from "lucide-react";

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
  const renderRewards = () => {
    const badges = [];
    if (gift.rewards?.coins) badges.push({ text: `${gift.rewards.coins} Coin${gift.rewards.coins === 1 ? '' : 's'}`, icon: Coins });
    if (gift.rewards?.resources?.cpuPercent) badges.push({ text: `${gift.rewards.resources.cpuPercent}% CPU`, icon: Cpu });
    if (gift.rewards?.resources?.memoryMb) badges.push({ text: `${gift.rewards.resources.memoryMb}MB RAM`, icon: MemoryStick });
    if (gift.rewards?.resources?.diskMb) badges.push({ text: `${gift.rewards.resources.diskMb}MB Disk`, icon: HardDrive });
    if (gift.rewards?.resources?.serverSlots) badges.push({ text: `${gift.rewards.resources.serverSlots} Slot${gift.rewards.resources.serverSlots === 1 ? '' : 's'}`, icon: Server });
    
    if (badges.length === 0) return <span className="text-sm text-[#555]">No rewards</span>;

    return (
      <div className="flex flex-wrap gap-1.5">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#222] text-[#AAA] text-[10px] font-medium tracking-wide uppercase border border-[#333]">
              <Icon size={10} className="text-[#888]" />
              {b.text}
            </span>
          );
        })}
      </div>
    );
  };

  const isExpired = gift.validUntil && new Date(gift.validUntil) < new Date();
  
  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      {/* Code */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Code</p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">{gift.code}</span>
      </div>

      {/* Creator */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Creator</p>
        <span className="block truncate text-sm text-[#AAAAAA]">
          {gift.createdBy ? gift.createdBy.username : "System"}
        </span>
        <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
          {gift.source === "user" ? "User Generated" : "Admin Generated"}
        </span>
      </div>

      {/* Rewards */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Rewards</p>
        {renderRewards()}
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
