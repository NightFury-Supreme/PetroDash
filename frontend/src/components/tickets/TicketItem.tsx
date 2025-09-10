"use client";

import React, { useState } from "react";

export default function TicketItem({ ticket }: { ticket: any }) {
  const [isOpening, setIsOpening] = useState(false);
  return (
    <div
      onClick={async ()=>{ setIsOpening(true); window.location.href=`/tickets/${ticket._id}`; }}
      className={`cursor-pointer border border-[#303030] rounded-xl p-4 bg-[#181818] hover:bg-[#1c1c1c] transition-colors relative ${isOpening ? 'opacity-70' : ''}`}
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
            {ticket.deletedByUser ? (
              <span className="px-2 py-0.5 rounded-full border bg-red-600/20 text-red-300 border-red-700/50">Deleted</span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full border ${ticket.status==='open' ? 'bg-green-600/20 text-green-300 border-green-700/50' : ticket.status==='pending' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50' : ticket.status==='resolved' ? 'bg-blue-600/20 text-blue-300 border-blue-700/50' : 'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{ticket.status}</span>
            )}
            {ticket.category && <span className="px-2 py-0.5 rounded-full border border-[#404040] bg-[#202020] text-[#e5e5e5]"><i className="fas fa-folder mr-1"/>{ticket.category}</span>}
          </div>
        </div>
        <div className="text-xs text-[#AAAAAA] whitespace-nowrap ml-3">{new Date(ticket.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
}


