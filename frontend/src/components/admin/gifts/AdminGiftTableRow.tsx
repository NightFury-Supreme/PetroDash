/* ==========================================================================
   Admin Gift Table Row Component
   Compliance: ISO/IEC 25010, Strong Typing, Accessibility
========================================================================== */

import { Edit2, Trash2, Users, Coins, Cpu, MemoryStick, HardDrive, Server, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { AdminGiftItem } from "./types";

interface AdminGiftTableRowProps {
  gift: AdminGiftItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRedemptions: (id: string) => void;
  cols: string;
}

export function AdminGiftTableRow({
  gift,
  onEdit,
  onDelete,
  onRedemptions,
  cols,
}: AdminGiftTableRowProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');

  const renderRewards = () => {
    const badges = [];
    if (gift.rewards?.coins) badges.push({ text: `${gift.rewards.coins} ${gift.rewards.coins === 1 ? t('coin') : t('coins')}`, icon: Coins });
    if (gift.rewards?.resources?.cpuPercent) badges.push({ text: `${gift.rewards.resources.cpuPercent}% ${t('cpu')}`, icon: Cpu });
    if (gift.rewards?.resources?.memoryMb) badges.push({ text: `${gift.rewards.resources.memoryMb}MB ${t('ram')}`, icon: MemoryStick });
    if (gift.rewards?.resources?.diskMb) badges.push({ text: `${gift.rewards.resources.diskMb}MB ${t('disk')}`, icon: HardDrive });
    if (gift.rewards?.resources?.serverSlots) badges.push({ text: `${gift.rewards.resources.serverSlots} ${gift.rewards.resources.serverSlots === 1 ? t('slot') : t('slots')}`, icon: Server });
    
    if (badges.length === 0) return <span className="text-sm text-[#555]">{t('noRewards')}</span>;

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
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('code')}</p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">{gift.code}</span>
      </div>

      {/* Creator */}
      <div className="min-w-0 flex flex-col items-start justify-center">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('creator')}</p>
        <Link 
          href={gift.createdBy?._id ? `/admin/users/${gift.createdBy._id}` : "#"}
          className={`flex items-center gap-2 group/creator ${gift.createdBy?._id ? "cursor-pointer" : "cursor-default pointer-events-none"}`}
        >
          <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
            {gift.createdBy?.profilePicture ? (
              <img src={gift.createdBy.profilePicture} alt={tCommon('avatar')} className="w-full h-full object-cover" />
            ) : (
              <User size={12} className="text-[#888]" />
            )}
          </div>
          <div>
            <span className={`block truncate text-sm text-[#AAAAAA] ${gift.createdBy?._id ? "group-hover/creator:text-[#FF5722] transition-colors" : ""}`}>
              {gift.createdBy ? gift.createdBy.username : tCommon('system')}
            </span>
            <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
              {gift.createdBy?._id || tCommon('system')}
            </span>
          </div>
        </Link>
      </div>

      {/* Rewards */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('rewards')}</p>
        {renderRewards()}
      </div>

      {/* Uses */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('uses')}</p>
        <span className="text-sm text-[#AAAAAA]">{gift.redeemedCount || 0} / {gift.maxRedemptions || "∞"}</span>
      </div>

      {/* Valid Until */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('expires')}</p>
        <span className="text-sm text-[#AAAAAA]">
          {gift.validUntil ? new Date(gift.validUntil).toLocaleDateString() : tCommon('never')}
        </span>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{tCommon('status')}</p>
        {isExpired ? (
          <span className="inline-flex items-center px-2 py-1 rounded bg-[#222] text-[#888] text-[10px] font-medium tracking-wide uppercase border border-[#333]">{t('statusExpired')}</span>
        ) : gift.enabled ? (
          <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">{t('statusEnabled')}</span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">{t('statusDisabled')}</span>
        )}
      </div>

      {/* Actions */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <button
            onClick={() => onRedemptions(gift._id)}
            title={t('viewRedemptions')}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#FF5722] hover:bg-[#FF5722]/10 transition-colors"
          >
            <Users size={14} />
          </button>
          <button
            onClick={() => onEdit(gift._id)}
            title={t('editGift')}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] hover:bg-[#2A2A2A] transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(gift._id)}
            title={t('deleteGift')}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
