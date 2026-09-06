'use client';

import React from 'react';
import { CheckCircle2, Inbox, MoreHorizontal } from 'lucide-react';
import { SupportTicket, TicketAction, TicketStatus } from './types';
import { TicketStatusBadge } from './TicketStatusBadge';
import { formatRelative, shortId } from './utils';

interface TicketRowItemProps {
  ticket: SupportTicket;
  menuOpen: boolean;
  onOpen: () => void;
  onMenu: (e: React.MouseEvent) => void;
  onStatus: (action: TicketAction) => void;
}

export function TicketRowItem({ ticket, menuOpen, onOpen, onMenu, onStatus }: TicketRowItemProps) {
  return (
    <div className="relative border-b border-white/[0.06] transition-colors hover:bg-white/[0.015]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 md:grid-cols-[1fr_110px_130px_100px_36px] md:gap-4">

        {/* Subject + ID */}
        <button type="button" onClick={onOpen} className="min-w-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-medium text-white/70 transition-colors hover:text-white">
                  {ticket.title}
                </span>
                <span className="hidden shrink-0 font-mono text-[10px] text-white/20 sm:inline">
                  #{shortId(ticket._id)}
                </span>
              </div>
              {/* Mobile meta */}
              <div className="mt-0.5 flex items-center gap-1.5 md:hidden">
                <span className="text-[11px] capitalize text-white/30">{ticket.category || 'general'}</span>
                <span className="text-white/10">&middot;</span>
                <span className="text-[11px] text-white/25">{formatRelative(ticket.updatedAt)}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Category — desktop */}
        <span className="hidden text-xs capitalize text-white/30 md:block">
          {ticket.category || 'general'}
        </span>

        {/* Updated — desktop */}
        <span className="hidden text-xs text-white/25 md:block">
          {formatRelative(ticket.updatedAt)}
        </span>

        {/* Status badge */}
        <span><TicketStatusBadge status={ticket.status} /></span>

        {/* Actions menu */}
        <div className="relative flex justify-end">
          <button
            type="button"
            onClick={onMenu}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] text-white/30 transition-colors hover:border-white/[0.12] hover:text-white/70"
          >
            <MoreHorizontal size={13} />
          </button>

          {menuOpen && (
            <TicketContextMenu status={ticket.status} onStatus={onStatus} />
          )}
        </div>
      </div>
    </div>
  );
}

function TicketContextMenu({ status, onStatus }: {
  status: TicketStatus;
  onStatus: (a: TicketAction) => void;
}) {
  return (
    <div
      className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#161616] py-1 shadow-xl"
      onClick={e => e.stopPropagation()}
    >
      <CtxItem icon={<CheckCircle2 size={12} />} label="Mark resolved" disabled={status === 'resolved' || status === 'closed'} onClick={() => onStatus('resolved')} />
      <CtxItem icon={<Inbox size={12} />} label="Reopen" disabled={status === 'open'} onClick={() => onStatus('reopen')} />
    </div>
  );
}

function CtxItem({ icon, label, onClick, disabled = false, danger = false }: {
  icon: React.ReactNode; label: string; onClick: () => void;
  disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
        disabled ? 'cursor-not-allowed text-[#3a3a3a]'
          : danger ? 'text-[#ef4444] hover:bg-[#2A1111]'
            : 'text-[#888] hover:bg-[#1e1e1e] hover:text-[#ddd]'
      }`}
    >
      {icon}{label}
    </button>
  );
}
