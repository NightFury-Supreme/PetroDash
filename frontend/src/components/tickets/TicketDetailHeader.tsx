"use client";

import React from "react";

export default function TicketDetailHeader({ ticket, contentPadding, onMenu }: { ticket: any; contentPadding: number; onMenu: (id: string) => void; }) {
  return (
    <div className="fixed top-0 right-0 z-40" style={{ left: contentPadding }}>
      <div className="h-20 px-6 flex items-center justify-between border-b border-[#303030] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <a href="/tickets" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]">
            <i className="fas fa-arrow-left" />
          </a>
          <div className="w-12 h-12 bg-[#202020] border border-[#303030] rounded-2xl flex items-center justify-center text-white">
            <i className="fa-solid fa-ticket" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{ticket.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ticket.status==='open'?'bg-green-600/20 text-green-300 border-green-700/50':ticket.status==='pending'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':ticket.status==='resolved'?'bg-blue-600/20 text-blue-300 border-blue-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{ticket.status?.toUpperCase()}</span>
              {ticket.category && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#303030] text-white border-[#404040]"><i className="fas fa-folder mr-1"/> {ticket.category}</span>}
            </div>
            <div className="text-sm text-[#AAAAAA]">Chat with support</div>
          </div>
          <div className="ml-auto">
            <div className="relative">
              <button id="ticket-menu-btn" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]" onClick={()=>onMenu('toggle')}><i className="fas fa-ellipsis-h"/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


