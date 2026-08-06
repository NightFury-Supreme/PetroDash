"use client";

import { useState, useRef, useEffect } from "react";

export default function TicketDetailHeader({ ticket, contentPadding, onAction }: { ticket: any; contentPadding: number; onAction: (action: "close" | "delete") => void; }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="fixed top-0 right-0 z-40" style={{ left: contentPadding }}>
      <div className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-[#202020] bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full">
          <a href="/tickets" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111] flex-shrink-0">
            <i className="fas fa-arrow-left" />
          </a>
          <div className="w-12 h-12 bg-[#202020] border border-[#303030] rounded-2xl flex items-center justify-center text-white flex-shrink-0">
            <i className="fa-solid fa-ticket" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-white truncate max-w-xs md:max-w-md">{ticket.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${ticket.status==='open'?'bg-green-600/20 text-green-300 border-green-700/50':ticket.status==='pending'?'bg-yellow-600/20 text-yellow-300 border-yellow-700/50':ticket.status==='resolved'?'bg-blue-600/20 text-blue-300 border-blue-700/50':'bg-[#303030] text-[#AAAAAA] border-[#404040]'}`}>{ticket.status?.toUpperCase()}</span>
              {ticket.category && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#303030] text-white border-[#404040] flex-shrink-0"><i className="fas fa-folder mr-1"/> {ticket.category}</span>}
            </div>
            <div className="text-sm text-[#AAAAAA] mt-1">Chat with support</div>
          </div>
          <div className="ml-auto flex-shrink-0" ref={menuRef}>
            <div className="relative">
              <button id="ticket-menu-btn" className="w-10 h-10 rounded-xl border border-[#303030] flex items-center justify-center text-white hover:bg-[#111]" onClick={()=>setMenuOpen(v => !v)}><i className="fas fa-ellipsis-h"/></button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[#303030] bg-[#181818] shadow-xl z-50">
                  {ticket?.status !== "closed" && ticket?.status !== "resolved" && (
                    <button
                      onClick={() => { onAction("close"); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#202020]"
                    >
                      Close Ticket
                    </button>
                  )}
                  <button
                    onClick={() => { onAction("delete"); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#202020] rounded-b-lg"
                  >
                    Delete Ticket
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


