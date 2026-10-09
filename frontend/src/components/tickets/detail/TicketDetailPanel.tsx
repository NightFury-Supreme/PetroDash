'use client';

import React from 'react';
import { CheckCircle2, Clipboard, Info } from 'lucide-react';
import { Priority, PRIORITY_DOT, TicketStatus } from '../types';
import { formatRelative } from '../utils';

interface TicketDetailPanelProps {
  ticketId:    string;
  status:      TicketStatus;
  category:    string;
  priority:    Priority;
  createdDate: string;
  updatedAt:   string;
  replyAllowed: boolean;
  statusBusy:  boolean;
  statusDone?: 'resolved' | 'reopen' | null;
  copied:      boolean;
  adminsInvolved: string;
  onResolve:   () => void;
  onReopen:    () => void;
  onCopyId:    () => void;
}

export function TicketDetailPanel({
  ticketId, status, category, priority, createdDate, updatedAt,
  replyAllowed, statusBusy, statusDone, copied, adminsInvolved,
  onResolve, onReopen, onCopyId,
}: TicketDetailPanelProps) {
  return (
    <aside className="flex w-full flex-col bg-[#0F0F0F] p-2 sm:p-4">
      <div>
        <h3 className="mb-5 text-sm font-semibold text-white/90">Overview</h3>
        <div className="flex flex-col gap-5">
          
          {/* Priority */}
          <div className="border-b border-white/[0.06] pb-4">
            <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 mb-2">
              Priority <Info size={14} className="text-white/30" />
            </span>
            <div className="flex items-center gap-2 text-sm font-medium text-white/70 capitalize">
              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[priority.toLowerCase()] ?? 'bg-white/20'}`} />
              <span>{priority}</span>
            </div>
          </div>

          {/* Status */}
          <div className="border-b border-white/[0.06] pb-4">
            <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 mb-2">
              Status <Info size={14} className="text-white/30" />
            </span>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <CheckCircle2 size={16} />
              <span className="capitalize">{status}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-b border-white/[0.06] pb-4 flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Category</span>
              <span className="text-white/70 capitalize">{category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Ticket ID</span>
              <button
                onClick={onCopyId}
                className="flex items-center gap-1.5 font-mono text-white/70 transition-colors hover:text-white"
              >
                #{ticketId}
                <Clipboard size={12} className={copied ? 'text-emerald-400' : 'text-white/30'} />
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Admins</span>
              <span className="text-white/70">{adminsInvolved}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Created</span>
              <span className="text-white/70">{createdDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Updated</span>
              <span className="text-white/70">{formatRelative(updatedAt)}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex flex-col gap-2">
            {replyAllowed ? (
              <button
                disabled={statusBusy}
                onClick={onResolve}
                className="w-full rounded-lg border border-[#FF5722]/25 bg-[#FF5722]/[0.06] px-3 py-2 text-xs font-semibold text-[#FF5722] transition-colors hover:bg-[#FF5722]/[0.12] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {statusBusy && statusDone === null ? (
                  <><span className="h-3 w-3 rounded-full border-2 border-[#FF5722] border-t-transparent animate-spin" /> Resolving…</>
                ) : statusDone === 'resolved' ? (
                  <><span className="text-emerald-400">✓</span> Resolved!</>
                ) : 'Resolve Ticket'}
              </button>
            ) : status === 'resolved' ? (
              <button
                disabled={statusBusy}
                onClick={onReopen}
                className="w-full rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/[0.12] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {statusBusy && statusDone === null ? (
                  <><span className="h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /> Reopening…</>
                ) : statusDone === 'reopen' ? (
                  <><span className="text-emerald-400">✓</span> Reopened!</>
                ) : 'Reopen Ticket'}
              </button>
            ) : null}
          </div>

        </div>
      </div>
    </aside>
  );
}
