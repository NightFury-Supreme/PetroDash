'use client';

import React from 'react';
import { Server, Coins } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { RankBadge, StatusIndicator, UserAvatar } from '@/components/ui';
import { AdminUserRowActions } from './AdminUserRowActions';
import type { AdminUserListItem } from '@/hooks/admin/users/types';

export interface AdminUserRowData {
  id: string;
  username: string;
  email: string;
  role?: string;
  coins?: number;
  serverCount?: number;
  serversCount?: number;
  profilePicture?: string;
  ban?: {
    isBanned?: boolean;
    reason?: string;
    until?: string | null;
  };
  oauthProviders?: {
    discord?: { id?: string; avatar?: string };
    google?: { picture?: string };
  };
  [key: string]: unknown;
}

interface AdminUserTableRowProps {
  user: AdminUserListItem;
  onDelete: (id: string, username: string, email?: string) => void;
  onToggleBan?: (user: AdminUserListItem) => void;
  onOpenBan?: (user: AdminUserListItem) => void;
  onOpenUnban?: (user: AdminUserListItem) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
}

export function AdminUserTableRow({
  user,
  onDelete,
  onToggleBan,
  onOpenBan,
  onOpenUnban,
  banningUserId,
  deletingUserId,
}: AdminUserTableRowProps) {
  const t = useTranslations('admin.users');

  const isBanned = Boolean(user.ban?.isBanned);
  const userAvatar = user.profilePicture || '';

  return (
    <div className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] lg:grid-cols-[1.8fr_1.2fr_90px_90px_100px_120px] lg:items-center">
      {/* User (Avatar, Name, Email) */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('user')}
        </p>
        <Link
          href={`/admin/users/${user.id}`}
          className="flex items-center gap-2.5 group/link w-fit max-w-full"
        >
          <UserAvatar
            src={userAvatar}
            username={user.username}
            email={user.email}
            size="md"
            rounded="full"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                {user.username}
              </p>
              <RankBadge rank={user.role || 'user'} size="sm" />
            </div>
            <p className="text-[10px] text-[#666] truncate">
              {user.email}
            </p>
          </div>
        </Link>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('userId')}
        </p>
        <span
          className="block truncate font-mono text-[10px] text-[#777] tracking-tight"
          title={user.id}
        >
          {user.id}
        </span>
      </div>

      {/* Status */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('status')}
        </p>
        <div>
          <StatusIndicator status={isBanned ? 'banned' : 'active'} label={isBanned ? t('banned') : t('active')} />
        </div>
      </div>

      {/* Servers */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('servers')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Server size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{user.serverCount ?? 0}</span>
        </div>
      </div>

      {/* Coins */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {t('coins')}
        </p>
        <div className="flex items-center gap-1.5 font-normal text-[#E0E0E0] text-sm">
          <Coins size={14} strokeWidth={1.5} className="text-white" />
          <span className="truncate">{(user.coins ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <AdminUserRowActions
        user={user}
        onDelete={onDelete}
        onToggleBan={onToggleBan}
        onOpenBan={onOpenBan}
        onOpenUnban={onOpenUnban}
        banningUserId={banningUserId}
        deletingUserId={deletingUserId}
      />
    </div>
  );
}
