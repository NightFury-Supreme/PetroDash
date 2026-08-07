"use client";

import React, { useState } from "react";

export default function TicketItem({ ticket, onRefresh }: { ticket: any, onRefresh?: () => void }) {
  const [isOpening, setIsOpening] = useState(false);
  const [menu, setMenu] = useState(false);

  const handleAction = async (action: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets/${ticket._id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      onClick={async ()=>{ setIsOpening(true); window.location.href=`/tickets/${ticket._id}`; }}
      className={`cursor-pointer border border-[var(--border)] rounded-xl p-4 bg-[var(--surface)] relative shadow-sm ${isOpening ? 'opacity-70' : ''} ${menu ? 'z-50' : 'z-10'}`}
    >
      {isOpening && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold truncate max-w-[60vw]">{ticket.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full border ${ticket.status==='open' ? 'bg-green-600/20 text-green-300 border-green-700/50' : ticket.status==='pending' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50' : ticket.status==='resolved' ? 'bg-blue-600/20 text-blue-300 border-blue-700/50' : 'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{ticket.status}</span>
            {ticket.category && <span className="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[#181818] text-[#e5e5e5]"><i className="fas fa-folder mr-1"/>{ticket.category}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-[#AAAAAA] whitespace-nowrap hidden sm:block">{new Date(ticket.updatedAt).toLocaleString()}</div>
          <div className="relative" onClick={(e)=>e.stopPropagation()}>
            <button onClick={()=>setMenu(!menu)} className="w-9 h-9 rounded-lg border border-[var(--border)] text-white hover:bg-[var(--hover)] flex items-center justify-center transition-colors">
              <i className="fas fa-ellipsis-h"/>
            </button>
            {menu && (
              <div className="absolute right-0 top-12 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden z-20">
                {(ticket.status === 'closed' || ticket.status === 'resolved') ? (
                  <button onClick={async()=>{ await handleAction('reopen'); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[var(--hover)]">Reopen Ticket</button>
                ) : (
                  <button onClick={async()=>{ await handleAction('close'); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[var(--hover)]">Close Ticket</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


