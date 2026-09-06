'use client';

import React from 'react';
import {
  CheckCircle2, Clock3, HelpCircle, Inbox, MessageSquare, Ticket, MailOpen
} from 'lucide-react';
import { TicketStatus } from './types';

interface Counts {
  all: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
}

interface TicketNavSidebarProps {
  active: TicketStatus | 'all';
  counts: Counts;
  onSelect: (status: TicketStatus | 'all') => void;
}

export function TicketNavSidebar({ active, counts, onSelect }: TicketNavSidebarProps) {
  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="sticky top-6">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#555]">Tickets</p>
        <nav className="space-y-0.5">
          <NavItem icon={Inbox} label="All tickets" count={counts.all} active={active === 'all'} onClick={() => onSelect('all')} />
          <NavItem icon={MailOpen} label="Open" count={counts.open} active={active === 'open'} onClick={() => onSelect('open')} />
          <NavItem icon={Clock3} label="Pending" count={counts.pending} active={active === 'pending'} onClick={() => onSelect('pending')} />
          <NavItem icon={CheckCircle2} label="Resolved" count={counts.resolved} active={active === 'resolved'} onClick={() => onSelect('resolved')} />
          <NavItem icon={Ticket} label="Closed" count={counts.closed} active={active === 'closed'} onClick={() => onSelect('closed')} />
        </nav>

        <div className="mt-8 mb-3 border-t border-[#333] pt-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Support</p>
        </div>
        <nav className="space-y-0.5">
          <NavItem icon={HelpCircle} label="Help Center" count={null} active={false} onClick={() => {}} />
          <NavItem icon={MessageSquare} label="Contact Support" count={null} active={false} onClick={() => {}} />
        </nav>
      </div>
    </aside>
  );
}



function NavItem({ icon: Icon, label, count, active, onClick }: {
  icon: any; label: string; count: number | null; active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
        active
          ? 'bg-white/10 text-white'
          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
      }`}
    >
      {typeof Icon === 'function' && Icon.length === 0
        ? <span className="shrink-0 flex items-center justify-center w-[17px] h-[17px]"><Icon /></span>
        : <Icon size={17} strokeWidth={1.75} className="shrink-0" />
      }
      <span className="flex-1 truncate">{label}</span>
      {count !== null && (
        <span className={`text-[11px] font-mono ${active ? 'text-white/50' : 'text-[#444]'}`}>{count}</span>
      )}
    </button>
  );
}
