'use client';

import React from 'react';
import {
  CheckCircle2, Clock3, Inbox, Trash2, Ticket, MailOpen
} from 'lucide-react';

interface Counts {
  all: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  deleted: number;
}

export function AdminTicketNavSidebar({
  activeStatus,
  onStatusChange,
  counts,
  loading,
  onOpenSettings,
}: {
  activeStatus: string;
  onStatusChange: (v: string) => void;
  counts: Counts;
  loading?: boolean;
  onOpenSettings?: () => void;
}) {

  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="sticky top-6 flex flex-col gap-6">
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#555]">Tickets</p>
          <nav className="space-y-0.5 pr-1">
            <NavItem icon={Inbox} label="All tickets" count={counts.all} active={activeStatus === 'all'} loading={loading} onClick={() => onStatusChange('all')} />
            <NavItem icon={MailOpen} label="Open" count={counts.open} active={activeStatus === 'open'} loading={loading} onClick={() => onStatusChange('open')} />
            <NavItem icon={Clock3} label="Pending" count={counts.pending} active={activeStatus === 'pending'} loading={loading} onClick={() => onStatusChange('pending')} />
            <NavItem icon={CheckCircle2} label="Resolved" count={counts.resolved} active={activeStatus === 'resolved'} loading={loading} onClick={() => onStatusChange('resolved')} />
            <NavItem icon={Ticket} label="Closed" count={counts.closed} active={activeStatus === 'closed'} loading={loading} onClick={() => onStatusChange('closed')} />
            <NavItem icon={Trash2} label="Deleted" count={counts.deleted} active={activeStatus === 'deleted'} loading={loading} onClick={() => onStatusChange('deleted')} />
          </nav>
        </div>

        {onOpenSettings && (
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#555]">Management</p>
            <nav className="space-y-0.5 pr-1">
              <NavItem 
                icon={() => <i className="fas fa-cog text-[13px] text-inherit" />} 
                label="Settings" 
                count={null} 
                active={false} 
                loading={false}
                onClick={onOpenSettings} 
              />
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}



export function NavItem({ icon: Icon, label, count, active, loading, onClick }: {
  icon: any; label: string; count: number | null; active: boolean; loading?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-lg py-2 px-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
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
        loading ? (
          <span className="w-3.5 h-3.5 bg-white/10 rounded animate-pulse" />
        ) : (
          <span className={`text-[11px] font-mono ${active ? 'text-white/50' : 'text-[#444]'}`}>{count}</span>
        )
      )}
    </button>
  );
}
