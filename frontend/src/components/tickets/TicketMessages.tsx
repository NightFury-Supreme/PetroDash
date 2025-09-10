"use client";

import React from "react";

export default function TicketMessages({ ticket }:{ ticket: any }){
  return (
    <div className="pb-28 px-2 space-y-3 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      {(ticket.messages || []).map((m:any, idx:number) => {
        const isAdmin = String(m.author?._id || m.author) !== String(ticket.user?._id || ticket.user);
        const authorName = m.author?.username || m.author?.email || (isAdmin ? 'Admin' : 'You');
        const rowCls = isAdmin ? 'justify-start' : 'justify-end';
        const bubbleBase = 'max-w-[80%] rounded-2xl px-4 py-2 shadow border';
        const bubbleAdmin = 'bg-[#181818] border-[#303030] text-white rounded-tl-none';
        const bubbleUser = 'bg-[#202020] border-[#303030] text-white rounded-tr-none';
        return (
          <div key={idx} className={`w-full flex ${rowCls}`}>
            <div className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} max-w-full`}>
              <div className={`text-xs ${isAdmin ? 'text-left' : 'text-right'} text-[#CCCCCC] mb-1 flex ${isAdmin ? 'justify-start' : 'justify-end'} items-center gap-2 w-full`}>
                <span className="text-white">{authorName}</span>
                {isAdmin && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-[#202020] text-white border-[#303030]">ADMIN</span>}
              </div>
              <div className={`${bubbleBase} ${isAdmin ? bubbleAdmin : bubbleUser} relative`}>
                <div className="whitespace-pre-wrap pr-16 break-words">{m.body}</div>
                <div className="absolute bottom-1 right-3 text-[11px] text-[#AAAAAA]">{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


