"use client";

import React, { useState } from "react";
import { CheckCircle2, Inbox, MoreHorizontal, ShieldOff, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { formatRelative, shortId } from "@/components/tickets/utils";
import { useToast } from "@/components/ui/ToastProvider";

type Ticket = { 
  _id: string; 
  title: string; 
  status: string; 
  priority: string; 
  category?: string; 
  updatedAt: string; 
  deletedByUser?: boolean; 
  user?: { username?: string; email?: string } 
};

export default function TicketItem({ ticket: t, onAction, isAdmin = false }:{ ticket: Ticket; onAction: (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string)=>Promise<void> | void, isAdmin?: boolean }){
  const [opening, setOpening] = useState(false);
  const [menu, setMenu] = useState(false);
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading'>('idle');
  const { showError, showSuccess } = useToast();

  const handleContextAction = async (action: 'close'|'resolve'|'delete'|'restore'|'reopen') => {
    setActionStatus('loading');
    setMenu(false);
    try {
      await onAction(action, t._id);
      const actionMsg = {
        close: 'Ticket closed',
        resolve: 'Ticket marked as resolved',
        delete: 'Ticket deleted',
        restore: 'Ticket restored',
        reopen: 'Ticket reopened'
      }[action] || 'Ticket updated';
      showSuccess(actionMsg);
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong';
      showError(msg);
    } finally {
      setActionStatus('idle');
    }
  };

  const isBusy = actionStatus === 'loading' || opening;

  return (
    <div className={`relative transition-opacity ${isBusy ? 'opacity-60' : 'opacity-100'} ${menu ? 'z-50' : 'z-0'}`}>
      <div className={`grid grid-cols-[1fr_auto] items-center gap-3 py-4 md:gap-4 ${isAdmin ? 'md:grid-cols-[1fr_130px_100px_90px_80px_60px_36px]' : 'md:grid-cols-[1fr_100px_90px_80px_60px_36px]'}`}>
        
        {/* Subject + ID */}
        <button type="button" onClick={()=>{ setOpening(true); window.location.href=isAdmin ? `/admin/tickets/${t._id}` : `/tickets/${t._id}`; }} className="min-w-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-[#D4D4D4] transition-colors hover:text-white">
                  {t.title}
                </span>
                <span className="hidden shrink-0 font-mono text-[10px] text-white/30 sm:inline">
                  {shortId(t._id)}
                </span>
              </div>
              {/* Mobile meta */}
              <div className="mt-0.5 flex items-center gap-1.5 md:hidden">
                {isAdmin && (
                  <>
                    <span className="text-[11px] capitalize text-[#888]">{t.user?.username || t.user?.email || 'User'}</span>
                    <span className="text-white/20">&middot;</span>
                  </>
                )}
                <span className="text-[11px] text-[#666]">{formatRelative(t.updatedAt)}</span>
              </div>
            </div>
          </div>
        </button>

        {/* User - desktop */}
        {isAdmin && (
          <div className="hidden md:block" title={t.user?.email || t.user?.username}>
            <span className="block truncate text-xs text-[#D4D4D4]">
              {t.user?.username || t.user?.email || 'User'}
            </span>
            <span className="block truncate text-[10px] text-[#555] mt-0.5">
              {t.user?.email !== t.user?.username ? t.user?.email || '' : ''}
            </span>
          </div>
        )}

        {/* Category - desktop */}
        <span className="hidden text-xs capitalize text-[#888] md:block">
          {t.category || 'general'}
        </span>

        {/* Updated - desktop */}
        <span className="hidden text-xs text-[#666] md:block">
          {formatRelative(t.updatedAt)}
        </span>

        {/* Status badge */}
        <span className="hidden md:block">
          <TicketStatusBadge status={t.status as any} />
        </span>

        {/* Priority */}
        <span className="hidden md:block text-xs">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize border
            ${t.priority === 'high' ? 'bg-[#FF3333]/10 text-[#FF3333] border-[#FF3333]/20' : 
              t.priority === 'medium' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20' : 
              'bg-[#303030]/50 text-[#888] border-[#333]'}
          `}>
            {t.priority}
          </span>
        </span>

        {/* Actions menu */}
        <div className="relative flex justify-end">
          <button
            type="button"
            disabled={actionStatus === 'loading'}
            onClick={(e) => { e.stopPropagation(); if (actionStatus === 'idle') setMenu(!menu); }}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors
              ${actionStatus === 'loading'
                ? 'border-[#2A2A2A] bg-[#161616] text-[#555] cursor-not-allowed'
                : 'border-[#2A2A2A] bg-[#161616] text-[#666] hover:border-[#3A3A3A] hover:text-[#ddd]'
              }`}
          >
            {actionStatus === 'loading' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <MoreHorizontal size={13} />
            )}
          </button>

          {menu && actionStatus === 'idle' && (
            <TicketContextMenu 
              ticket={t} 
              onAction={handleContextAction} 
              onClose={() => setMenu(false)}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TicketContextMenu({ ticket: t, onAction, onClose, isAdmin }: {
  ticket: Ticket;
  onAction: (a: 'close'|'resolve'|'delete'|'restore'|'reopen') => void;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div
        className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#161616] py-1 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {!t.deletedByUser ? (
          <>
            {(t.status === 'closed' || t.status === 'resolved') ? (
              <CtxItem icon={<Inbox size={12} />} label="Reopen Ticket" onClick={() => onAction('reopen')} />
              ) : (
                <>
                  <CtxItem icon={<CheckCircle2 size={12} />} label="Resolve" onClick={() => onAction('resolve')} />
                  {isAdmin && <CtxItem icon={<XCircle size={12} />} label="Close Ticket" onClick={() => onAction('close')} />}
                </>
              )}
            {isAdmin && <CtxItem icon={<ShieldOff size={12} />} label="Soft Delete" danger onClick={() => onAction('delete')} />}
          </>
        ) : isAdmin ? (
          <CtxItem icon={<RotateCcw size={12} />} label="Restore" onClick={() => onAction('restore')} />
        ) : null}
      </div>
    </>
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
