"use client";

import React, { useEffect, useRef } from "react";

function safeTime(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TicketMessages({ ticket }: { ticket: any }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const messages = (ticket?.messages || []) as any[];

  return (
    <div className="pb-28 px-4 md:px-8 space-y-4 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full space-y-4">
      {messages.map((m: any) => {
        // Use stored authorRole when available; fall back to old ID comparison
        const isAdmin =
          m.authorRole === "admin" ||
          (m.authorRole === undefined &&
            String(m.author?._id || m.author) !== String(ticket.user?._id || ticket.user));
        
        let authorName = m.author?.username || m.author?.email;
        if (!authorName) {
          authorName = isAdmin ? "Admin" : "You";
        } else if (isAdmin) {
          authorName = `${authorName} • Admin`;
        }

        const rowCls = isAdmin ? "justify-start" : "justify-end";
        const bubbleBase = "min-w-[100px] max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-3 shadow-sm text-[15px] leading-relaxed";
        const bubbleAdmin = "bg-[#181818] border border-[#303030] text-white rounded-2xl rounded-tl-sm";
        const bubbleUser = "bg-[#202020] border border-[#303030] text-white rounded-2xl rounded-tr-sm";
        const timeStr = safeTime(m.createdAt);

        return (
          <div key={m._id || m.createdAt || Math.random()} className={`w-full flex ${rowCls}`}>
            <div className={`flex flex-col ${isAdmin ? "items-start" : "items-end"} max-w-full`}>
              <div className={`text-xs ${isAdmin ? "text-left" : "text-right"} text-[#CCCCCC] mb-1 flex ${isAdmin ? "justify-start" : "justify-end"} items-center gap-2 w-full`}>
                <span className="text-white font-medium">{authorName}</span>
              </div>
              <div className={`${bubbleBase} ${isAdmin ? bubbleAdmin : bubbleUser} relative`}>
                <div className="whitespace-pre-wrap break-words pb-4">{m.body}</div>
                {timeStr && (
                  <div className={`absolute bottom-1.5 right-3 text-[11px] font-medium ${isAdmin ? 'text-[#888888]' : 'text-[#888888]'}`}>{timeStr}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
      </div>
    </div>
  );
}

