"use client";

import React from "react";

export default function AdminTicketInputBar({ contentPadding, value, internal, canSend, onChange, onToggleInternal, onSend }:{
  contentPadding: number;
  value: string;
  internal: boolean;
  canSend: boolean;
  onChange: (v: string)=>void;
  onToggleInternal: ()=>void;
  onSend: ()=>void;
}){
  if (!canSend) return null;
  return (
    <div className="fixed right-0 bottom-0" style={{ left: contentPadding }}>
      <div className="p-3">
        <div className="flex items-end gap-2 bg-[#202020] border border-[#303030] rounded-full px-3 py-2">
          <textarea
            value={value}
            onChange={e=>{ onChange(e.target.value); e.currentTarget.style.height='0px'; e.currentTarget.style.height=Math.min(140, e.currentTarget.scrollHeight)+'px'; }}
            onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); } }}
            placeholder="Type a message"
            rows={1}
            className="flex-1 bg-transparent outline-none text-white placeholder-[#AAAAAA] resize-none max-h-[140px]"
          />
          <button onClick={onToggleInternal} className={`px-2 py-1 text-xs rounded-full border ${internal ? 'bg-yellow-600/20 text-yellow-300 border-yellow-700/50' : 'bg-[#181818] text-white border-[#303030]'}`}>{internal ? 'INTERNAL' : 'PUBLIC'}</button>
          <button onClick={onSend} className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center"><i className="fas fa-paper-plane" /></button>
        </div>
      </div>
    </div>
  );
}


