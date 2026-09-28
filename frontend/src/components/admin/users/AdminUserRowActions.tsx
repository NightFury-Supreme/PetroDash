/* ==========================================================================
   Admin User Row Actions Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Settings, ShieldAlert, ShieldCheck, Trash, Loader2 } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
import { useTranslations } from 'next-intl';

interface AdminUserRowActionsProps {
  user: {
    _id: string;
    username: string;
    email?: string;
    ban?: {
      isBanned?: boolean;
      reason?: string;
      until?: string | null;
    };
  };
  onDelete: (id: string, username: string) => void;
  onToggleBan?: (user: any) => void;
  onOpenBan?: (user: any) => void;
  onOpenUnban?: (user: any) => void;
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
  const isBanning = banningUserId === user._id;
  const isDeleting = deletingUserId === user._id;

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
          href={`/admin/users/${user._id}`}
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
            <ShieldAlert size={15} />
          )}
        </RowActionButton>

        {/* Delete */}
        <RowActionButton
          variant="danger"
          onClick={() => onDelete(user._id, user.username)}
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
