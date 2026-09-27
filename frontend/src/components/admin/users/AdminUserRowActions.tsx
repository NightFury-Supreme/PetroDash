/* ==========================================================================
   Admin User Row Actions Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { ExternalLink, ShieldAlert, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface AdminUserRowActionsProps {
  user: {
    _id: string;
    username: string;
    ban?: {
      isBanned?: boolean;
    };
  };
  onDelete: (id: string, username: string) => void;
  onToggleBan: (user: any) => void;
  banningUserId: string | null;
  deletingUserId: string | null;
}

export function AdminUserRowActions({
  user,
  onDelete,
  onToggleBan,
  banningUserId,
  deletingUserId,
}: AdminUserRowActionsProps) {
  const t = useTranslations('admin.users');

  const isBanned = Boolean(user.ban?.isBanned);
  const isBanning = banningUserId === user._id;
  const isDeleting = deletingUserId === user._id;

  return (
    <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
      <div className="flex lg:justify-end gap-2">
        {/* Manage / Details */}
        <Link
          href={`/admin/users/${user._id}`}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] transition-colors"
          title={t('viewUser')}
        >
          <ExternalLink size={14} />
        </Link>

        {/* Quick Ban / Unban Toggle */}
        <button
          type="button"
          onClick={() => onToggleBan(user)}
          disabled={isBanning}
          title={isBanned ? t('quickUnban') : t('quickBan')}
          className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isBanned ? 'text-[#888] hover:text-[#00FF88]' : 'text-[#888] hover:text-[#FF5722]'
          }`}
        >
          {isBanning ? (
            <Loader2 size={14} className="animate-spin text-[#FF5722]" />
          ) : isBanned ? (
            <ShieldCheck size={14} />
          ) : (
            <ShieldAlert size={14} />
          )}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(user._id, user.username)}
          disabled={isDeleting}
          title={t('deleteUser')}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#FF4444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDeleting ? (
            <Loader2 size={14} className="animate-spin text-[#FF5722]" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
