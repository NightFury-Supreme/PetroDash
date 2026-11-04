import React from "react";
import { Settings, Trash, Users, Coins, Cpu, MemoryStick, HardDrive, Server } from "lucide-react";
import { Link } from "@/i18n/routing";
import { RowActionButton, StatusIndicator, UserAvatar } from "@/components/ui";
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

    if (badges.length === 0) return <span className="text-[10px] text-[#555]">{t('noRewards')}</span>;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-[#383838] select-none text-[9px]">|</span>}
              <div className="flex items-center gap-1 font-normal text-[#C4C4C4] text-[10px] leading-tight">
                <Icon size={10} strokeWidth={1.5} className="text-white shrink-0" />
                <span className="truncate">{b.text}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const isExpired = gift.validUntil && new Date(gift.validUntil) < new Date();

  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('code')}</p>
        <span className="block truncate font-mono text-sm text-[#DDDDDD]">{gift.code}</span>
        {gift.description ? (
          <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5" title={gift.description}>
            {gift.description}
          </span>
        ) : (
          <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5" title={gift.id}>
            {gift.id}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('creator')}</p>
        {gift.createdBy?.id ? (
          <Link
            href={`/admin/users/${gift.createdBy.id}`}
            className="flex items-center gap-2 group/link w-fit"
          >
            <UserAvatar
              src={gift.createdBy.profilePicture}
              username={gift.createdBy.username}
              email={gift.createdBy.email}
              size="sm"
              rounded="full"
              alt={tCommon('avatar')}
            />
            <div className="min-w-0">
              <p className="text-xs text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                {gift.createdBy.username}
              </p>
              <p className="text-[10px] text-[#555] truncate">
                {gift.createdBy.email || gift.createdBy.id}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <UserAvatar
              username={tCommon('system')}
              size="sm"
              rounded="full"
              alt={tCommon('avatar')}
            />
            <div className="min-w-0">
              <p className="text-xs text-[#D4D4D4] truncate">
                {tCommon('system')}
              </p>
              <p className="text-[10px] text-[#555] truncate">
                {tCommon('system')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('rewards')}</p>
        {renderRewards()}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('uses')}</p>
        <span className="text-sm text-[#AAAAAA]">{gift.redeemedCount || 0} / {gift.maxRedemptions || "∞"}</span>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t('expires')}</p>
        <span className="text-sm text-[#AAAAAA]">
          {gift.validUntil ? new Date(gift.validUntil).toLocaleDateString() : tCommon('never')}
        </span>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{tCommon('status')}</p>
        <StatusIndicator
          status={isExpired ? 'expired' : gift.enabled ? 'enabled' : 'disabled'}
          label={isExpired ? t('statusExpired') : gift.enabled ? t('statusEnabled') : t('statusDisabled')}
        />
      </div>

      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <RowActionButton
            variant="default"
            onClick={() => onRedemptions(gift.id)}
            title={t('viewRedemptions')}
          >
            <Users size={15} />
          </RowActionButton>
          <RowActionButton
            variant="default"
            onClick={() => onEdit(gift.id)}
            title={t('editGift')}
          >
            <Settings size={15} />
          </RowActionButton>
          <RowActionButton
            variant="danger"
            onClick={() => onDelete(gift.id)}
            title={t('deleteGift')}
          >
            <Trash size={15} />
          </RowActionButton>
        </div>
      </div>
    </div>
  );
}
