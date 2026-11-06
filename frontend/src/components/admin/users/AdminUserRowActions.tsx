'use client';

import React from 'react';
import { Settings, Gavel, ShieldCheck, Trash, Loader2 } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
import { useTranslations } from 'next-intl';
import type { AdminUserListItem } from '@/hooks/admin/users/types';

interface AdminUserRowActionsProps {
  user: AdminUserListItem;
  onDelete: (id: string, username: string, email?: string) => void;
  onToggleBan?: (user: AdminUserListItem) => void;
  onOpenBan?: (user: AdminUserListItem) => void;
  onOpenUnban?: (user: AdminUserListItem) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
}

export function AdminUserRowActions({
  user,
  onDelete,
  onToggleBan,
  onOpenBan,
  onOpenUnban,
  banningUserId,
  deletingUserId,
}: AdminUserRowActionsProps) {
  const t = useTranslations('admin.users');

  const isBanned = Boolean(user.ban?.isBanned);
  const isBanning = banningUserId === user.id;
  const isDeleting = deletingUserId === user.id;

  const handleBanClick = () => {
    if (isBanned) {
      if (onOpenUnban) {
        onOpenUnban(user);
      } else if (onToggleBan) {
        onToggleBan(user);
      }
    } else {
      if (onOpenBan) {
        onOpenBan(user);
      } else if (onToggleBan) {
        onToggleBan(user);
      }
    }
  };

  return (
    <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
      <div className="flex lg:justify-end items-center gap-2">
        {/* Manage / Details */}
        <RowActionButton
          variant="default"
          href={`/admin/users/${user.id}`}
          title={t('viewUser')}
        >
          <Settings size={15} />
        </RowActionButton>

        {/* Ban / Unban Drawer Trigger */}
        <RowActionButton
          variant={isBanned ? 'success' : 'danger'}
          onClick={handleBanClick}
          disabled={isBanning}
          title={isBanned ? t('unbanUser') : t('banUser')}
        >
          {isBanning ? (
            <Loader2
              size={15}
              className={`animate-spin ${isBanned ? 'text-emerald-400' : 'text-red-500'}`}
            />
          ) : isBanned ? (
            <ShieldCheck size={15} />
          ) : (
            <Gavel size={15} />
          )}
        </RowActionButton>

        {/* Delete */}
        <RowActionButton
          variant="danger"
          onClick={() => onDelete(user.id, user.username, user.email)}
          disabled={isDeleting}
          title={t('deleteUser')}
        >
          {isDeleting ? (
            <Loader2 size={15} className="animate-spin text-red-500" />
          ) : (
            <Trash size={15} />
          )}
        </RowActionButton>
      </div>
    </div>
  );
}
