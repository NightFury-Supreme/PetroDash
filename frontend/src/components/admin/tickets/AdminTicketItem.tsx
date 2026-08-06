"use client";

import React, { useState } from "react";

type Ticket = { _id: string; title: string; status: string; priority: string; category?: string; updatedAt: string; deletedByUser?: boolean; user?: { username?: string; email?: string } };

export default function AdminTicketItem({ t, onAction }:{ t: Ticket; onAction: (action: 'close'|'resolve'|'delete'|'restore', id: string)=>Promise<void> }){
  const [opening, setOpening] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div onClick={()=>{ setOpening(true); window.location.href=`/admin/tickets/${t._id}`; }} className={`cursor-pointer border border-[var(--border)] bg-[var(--surface)] rounded-xl p-4 flex items-center justify-between relative shadow-sm ${opening?'opacity-70':''} ${menu ? 'z-50' : 'z-10'}`}>
      <div>
        <div className="text-white font-medium flex items-center gap-2">
          {t.title}
          {t.deletedByUser ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-700/50">DELETED</span>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.status==='open'?'bg-green-600/20 text-green-300 border-green-700/50':t.status==='pending'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':t.status==='resolved'?'bg-blue-600/20 text-blue-300 border-blue-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{t.status.toUpperCase()}</span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.priority==='high'?'bg-red-600/20 text-red-300 border-red-700/50':t.priority==='medium'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{t.priority}</span>
          {t.category && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#181818] text-white border-[var(--border)]"><i className="fas fa-folder mr-1"/> {t.category}</span>}
        </div>
        <div className="text-xs text-[#AAAAAA]">{t.user?.username || t.user?.email || 'User'} • Updated {new Date(t.updatedAt).toLocaleString()}</div>
      </div>
      <div className="ml-3 flex items-center gap-2" onClick={(e)=>e.stopPropagation()}>
        <button onClick={()=>setMenu(!menu)} className="w-9 h-9 rounded-lg border border-[var(--border)] text-white hover:bg-[var(--hover)] flex items-center justify-center transition-colors">
          <i className="fas fa-ellipsis-h"/>
        </button>
        {menu && (
          <div className="absolute right-3 top-12 z-20 w-44 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden" onClick={(e)=>e.stopPropagation()}>
            {!t.deletedByUser ? (
              <>
                <button onClick={async()=>{ await onAction('close', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Close Ticket</button>
                <button onClick={async()=>{ await onAction('resolve', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Resolve</button>
                <button onClick={async()=>{ await onAction('delete', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#202020]">Soft Delete</button>
              </>
            ) : (
              <button onClick={async()=>{ await onAction('restore', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-[#202020]">Restore</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


