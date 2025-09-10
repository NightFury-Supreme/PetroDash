"use client";

import React, { useState } from "react";

type Ticket = { _id: string; title: string; status: string; priority: string; category?: string; updatedAt: string; deletedByUser?: boolean; user?: { username?: string; email?: string } };

export default function AdminTicketItem({ t, onAction }:{ t: Ticket; onAction: (action: 'close'|'resolve'|'delete'|'restore', id: string)=>Promise<void> }){
  const [opening, setOpening] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div onClick={()=>{ setOpening(true); window.location.href=`/admin/tickets/${t._id}`; }} className={`cursor-pointer border border-[#303030] rounded-lg p-3 flex items-center justify-between relative hover:bg-[#202020] ${opening?'opacity-70':''}`}>
      <div>
        <div className="text-white font-medium flex items-center gap-2">
          {t.title}
          {t.deletedByUser ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-700/50">DELETED</span>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.status==='open'?'bg-green-600/20 text-green-300 border-green-700/50':t.status==='pending'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':t.status==='resolved'?'bg-blue-600/20 text-blue-300 border-blue-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{t.status.toUpperCase()}</span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${t.priority==='high'?'bg-red-600/20 text-red-300 border-red-700/50':t.priority==='medium'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{t.priority}</span>
          {t.category && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#303030] text-white border-[#404040]"><i className="fas fa-folder mr-1"/> {t.category}</span>}
        </div>
        <div className="text-xs text-[#AAAAAA]">{t.user?.username || t.user?.email || 'User'} • Updated {new Date(t.updatedAt).toLocaleString()}</div>
      </div>
      <div className="ml-3 flex items-center gap-2" onClick={(e)=>e.stopPropagation()}>
        <button onClick={()=>setMenu(!menu)} className="w-9 h-9 rounded-lg border border-[#303030] text-white hover:bg-[#2a2a2a] flex items-center justify-center">
          <i className="fas fa-ellipsis-h"/>
        </button>
        {menu && (
          <div className="absolute right-3 top-12 z-20 w-44 rounded-lg border border-[#303030] bg-[#181818] shadow-xl" onClick={(e)=>e.stopPropagation()}>
            <button onClick={async()=>{ await onAction('close', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Close Ticket</button>
            <button onClick={async()=>{ await onAction('resolve', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]">Resolve</button>
            {!t.deletedByUser ? (
              <button onClick={async()=>{ await onAction('delete', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#202020]">Soft Delete</button>
            ) : (
              <button onClick={async()=>{ await onAction('restore', t._id); setMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-[#202020]">Restore</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


