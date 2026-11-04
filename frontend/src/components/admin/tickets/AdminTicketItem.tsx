"use client";

import React, { useState } from "react";
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Link } from '@/i18n/routing';
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { formatRelative, shortId } from "@/components/tickets/utils";
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { AdminTicketItemData } from "@/hooks/admin/tickets/types";
import type { TicketStatus } from "@/components/tickets/types";
import { AdminTicketRowActions } from './AdminTicketRowActions';

export function AdminTicketItem({ t: ticket, onAction }: { t: AdminTicketItemData; onAction: (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string) => Promise<void> }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const tr = useTranslations('AdminTickets');
  const tCommon = useTranslations('Common');
  const format = useFormatter();

  const avatarUrl =
    ticket.user?.profilePicture ||
    ticket.user?.oauthProviders?.discord?.avatar ||
    ticket.user?.oauthProviders?.google?.picture;

  const relativeTime = (() => {
    try {
      return format.relativeTime(new Date(ticket.updatedAt), { now: new Date() });
    } catch {
      return formatRelative(ticket.updatedAt);
    }
  })();

  const handleAction = async (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string) => {
    if (actionBusy) return;
    setActionBusy(action);
    try {
      await onAction(action, id);
    } finally {
      setActionBusy(null);
    }
  };

  const cols = 'lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_120px]';

  return (
    <div
      className={`group grid grid-cols-1 gap-4 px-5 py-3 transition hover:bg-white/[0.015] ${cols} lg:items-center ${opening ? 'opacity-70' : ''}`}
    >
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('ticket')}
        </p>
        <button
          type="button"
          onClick={() => { setOpening(true); router.push(`/admin/tickets/${ticket.id}`); }}
          className="text-left w-full group/title"
        >
          <span className="block truncate font-mono text-xs text-[#DDDDDD] group-hover/title:text-white transition-colors">
            {ticket.title}
          </span>
          <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
            {shortId(ticket.id)}
          </span>
        </button>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('user')}
        </p>
        {ticket.user?.id ? (
          <Link
            href={`/admin/users/${ticket.user.id}`}
            className="flex items-center gap-2 group/link w-fit"
          >
            <UserAvatar
              src={avatarUrl}
              username={ticket.user.username}
              email={ticket.user.email}
              size="sm"
              rounded="full"
            />
            <div className="min-w-0">
              <p className="text-xs text-[#D4D4D4] group-hover/link:text-[#FF5722] transition-colors truncate">
                {ticket.user.username}
              </p>
              <p className="text-[10px] text-[#555] truncate">
                {ticket.user.email}
              </p>
            </div>
          </Link>
        ) : (
          <span className="text-xs text-[#666]">-</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('category')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-xs">
          <span className="truncate capitalize">{ticket.category || tr('general')}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('updated')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-xs">
          <span className="truncate">{relativeTime}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('status')}
        </p>
        <div>
          <TicketStatusBadge status={ticket.status as TicketStatus} />
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">
          {tCommon('priority')}
        </p>
        <div>
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <AdminTicketRowActions
        ticket={ticket}
        onAction={handleAction}
        actionBusy={actionBusy}
      />
    </div>
  );
}

export default AdminTicketItem;

