"use client";

import React, { useState } from "react";

export default function TicketInputBar({ contentPadding, onSend }:{ contentPadding: number; onSend: (text: string)=>Promise<void>|void; }){
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const handleSend = async () => {
    if (!value.trim()) return;
    if (value.trim().length < 3) return; // client min length
    setSending(true);
    try { await onSend(value.trim()); setValue(""); } finally { setSending(false); }
  };
  return (
    <div className="fixed right-0 bottom-0" style={{ left: contentPadding }}>
      <div className="p-3">
        <div className="flex items-end gap-2 bg-[#202020] border border-[#303030] rounded-full px-3 py-2">
          <textarea
            value={value}
            onChange={e=>{ setValue(e.target.value); e.currentTarget.style.height='0px'; e.currentTarget.style.height=Math.min(140, e.currentTarget.scrollHeight)+'px'; }}
            onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-transparent outline-none text-white placeholder-[#AAAAAA] resize-none max-h-[140px]"
          />
          <button onClick={handleSend} disabled={sending || value.trim().length<3} className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 text-black flex items-center justify-center">
            {sending ? <i className="fas fa-spinner animate-spin"/> : <i className="fas fa-paper-plane" />}
          </button>
        </div>
      </div>
    </div>
  );
}


