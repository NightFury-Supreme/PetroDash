"use client";

import React, { useState } from "react";
import { CheckCircle2, Inbox, MoreHorizontal, ShieldOff, RotateCcw, XCircle } from 'lucide-react';
import { TicketStatusBadge } from "@/components/tickets/TicketStatusBadge";
import { formatRelative, shortId } from "@/components/tickets/utils";

type Ticket = { 
  _id: string; 
  title: string; 
  status: string; 
  priority: string; 
  category?: string; 
  updatedAt: string; 
  deletedByUser?: boolean; 
  user?: { 
    username?: string; 
    email?: string; 
    profilePicture?: string; 
    oauthProviders?: { 
      discord?: { avatar?: string }; 
      google?: { picture?: string }; 
    };
  } 
};

export default function AdminTicketItem({ t, onAction }:{ t: Ticket; onAction: (action: 'close'|'resolve'|'delete'|'restore'|'reopen', id: string)=>Promise<void> }){
  const [opening, setOpening] = useState(false);
  const [menu, setMenu] = useState(false);

  const avatarUrl =
    t.user?.profilePicture ||
    t.user?.oauthProviders?.discord?.avatar ||
    t.user?.oauthProviders?.google?.picture;

  return (
    <div className={`relative transition-colors hover:bg-white/[0.015] px-2 ${opening ? 'opacity-70' : ''} ${menu ? 'z-50' : 'z-0'}`}>
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-5 md:grid-cols-[1.5fr_2fr_100px_100px_100px_80px_36px] md:gap-4">
        
        {/* Subject + ID */}
        <button type="button" onClick={()=>{ setOpening(true); window.location.href=`/admin/tickets/${t._id}`; }} className="min-w-0 text-left">
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
                <span className="text-[11px] capitalize text-[#888]">{t.user?.username || t.user?.email || 'User'}</span>
                <span className="text-white/20">&middot;</span>
                <span className="text-[11px] text-[#666]">{formatRelative(t.updatedAt)}</span>
              </div>
            </div>
          </div>
        </button>

        {/* User - desktop */}
        <div className="hidden md:flex items-center gap-3 min-w-0 pr-4" title={t.user?.email || t.user?.username}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.035] overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={t.user?.username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    (e.target as HTMLImageElement).style.display = 'none';
                    parent.innerHTML = `<span class="text-xs font-bold text-[#D4D4D4]">${(t.user?.username?.charAt(0) || 'U').toUpperCase()}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-xs font-bold text-[#D4D4D4]">
                {(t.user?.username?.charAt(0) || 'U').toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs text-[#D4D4D4]">
              {t.user?.username || t.user?.email || 'User'}
            </span>
            <span className="block truncate text-[10px] text-[#555] mt-0.5">
              {t.user?.email !== t.user?.username ? t.user?.email || '' : ''}
            </span>
          </div>
        </div>

        {/* Category — desktop */}
        <span className="hidden text-xs capitalize text-[#888] md:block truncate">
          {t.category || 'general'}
        </span>

        {/* Updated — desktop */}
        <span className="hidden text-xs text-[#666] md:block truncate">
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
            onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#2A2A2A] bg-[#161616] text-[#666] transition-colors hover:border-[#3A3A3A] hover:text-[#ddd]"
          >
            <MoreHorizontal size={13} />
          </button>

          {menu && (
            <AdminTicketContextMenu 
              ticket={t} 
              onAction={async (action) => { await onAction(action, t._id); setMenu(false); }} 
              onClose={() => setMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AdminTicketContextMenu({ ticket: t, onAction, onClose }: {
  ticket: Ticket;
  onAction: (a: 'close'|'resolve'|'delete'|'restore'|'reopen') => void;
  onClose: () => void;
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
                <CtxItem icon={<XCircle size={12} />} label="Close Ticket" onClick={() => onAction('close')} />
              </>
            )}
            <CtxItem icon={<ShieldOff size={12} />} label="Soft Delete" danger onClick={() => onAction('delete')} />
          </>
        ) : (
          <CtxItem icon={<RotateCcw size={12} />} label="Restore" onClick={() => onAction('restore')} />
        )}
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
