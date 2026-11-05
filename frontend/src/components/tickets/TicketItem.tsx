"use client";

import React, { useState } from "react";
import { CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import { RowActionButton } from "@/components/ui/RowActionButton";
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/tickets/TicketPriorityBadge";
import { formatRelative, shortId } from "@/components/tickets/utils";
import type { TicketStatus } from "@/components/tickets/types";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "@/i18n/routing";

type Ticket = { 
  id: string; 
  title: string; 
  status: string; 
  priority?: string; 
  category?: string; 
  updatedAt: string; 
  deletedByUser?: boolean; 
  user?: { username?: string; email?: string; profilePicture?: string } 
};

export default function TicketItem({ ticket: t, onAction }:{ ticket: Ticket; onAction: (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string)=>Promise<void> | void }){
  const router = useRouter();
  const format = useFormatter();
  const [opening, setOpening] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const tr = useTranslations('Tickets');
  const tCommon = useTranslations('Common');

  const relativeTime = (() => {
    try {
      return format.relativeTime(new Date(t.updatedAt), { now: new Date() });
    } catch {
      return formatRelative(t.updatedAt);
    }
  })();

  const handleAction = async (action: 'close'|'resolve'|'delete'|'restore'|'reopen') => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await onAction(action, t.id);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      className={`group grid grid-cols-1 gap-4 px-5 py-3 transition hover:bg-white/[0.015] md:grid-cols-[1.5fr_1fr_1fr_100px_80px_120px] md:items-center ${opening ? 'opacity-70' : ''}`}
    >
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] md:hidden">
          {tCommon('ticket')}
        </p>
        <button
          type="button"
          onClick={() => {
            setOpening(true);
            router.push(`/tickets/${t.id}`);
          }}
          className="text-left w-full group/title"
        >
          <span className="block truncate font-mono text-xs text-[#DDDDDD] group-hover/title:text-white transition-colors">
            {t.title}
          </span>
          <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
            {shortId(t.id)}
          </span>
        </button>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] md:hidden">
          {tr('category')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-xs">
          <span className="truncate capitalize">{t.category || tr('general')}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] md:hidden">
          {tr('updated')}
        </p>
        <div className="flex items-center gap-2 text-[#AAAAAA] text-xs">
          <span className="truncate">{relativeTime}</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] md:hidden">
          {tCommon('status')}
        </p>
        <div>
          <TicketStatusBadge status={t.status as TicketStatus} />
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] md:hidden">
          {tr('priority')}
        </p>
        <div>
          <TicketPriorityBadge priority={t.priority} />
        </div>
      </div>

      <div className="min-w-0 md:text-right mt-2 md:mt-0">
        <div className="flex md:justify-end gap-2">
          {!t.deletedByUser ? (
            <>
              {t.status === 'closed' || t.status === 'resolved' ? (
                <RowActionButton
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('reopen');
                  }}
                  disabled={busyAction !== null}
                  title={tr('reopenTicket')}
                >
                  {busyAction === 'reopen' ? (
                    <Loader2 size={15} className="animate-spin text-white/70" />
                  ) : (
                    <Inbox size={15} />
                  )}
                </RowActionButton>
              ) : (
                <>
                  <RowActionButton
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction('resolve');
                    }}
                    disabled={busyAction !== null}
                    title={tr('resolve')}
                  >
                    {busyAction === 'resolve' ? (
                      <Loader2 size={15} className="animate-spin text-white/70" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                  </RowActionButton>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

