"use client";

import { useEffect, useRef } from "react";

function safeTime(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AdminTicketMessages({ ticket }: { ticket: any }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const messages = (ticket?.messages || []) as any[];

  return (
    <div className="pb-28 px-4 md:px-8 space-y-4 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full space-y-4">
      {messages.map((m: any) => {
        // Use stored authorRole when available; fall back to ID comparison
        const isFromUser =
          m.authorRole === "user" ||
          (m.authorRole === undefined &&
            String(m.author?._id || m.author) === String(ticket.user?._id || ticket.user));
        
        let authorName = m.author?.username || m.author?.email;
        if (!authorName) {
          authorName = isFromUser ? "User" : "Admin (You)";
        } else if (!isFromUser) {
          authorName = `${authorName} • Admin`;
        }

        // Admin's own messages should be on the right, User's messages on the left
        const rowCls = isFromUser ? "justify-start" : "justify-end";
        const bubbleBase = "min-w-[100px] max-w-[85%] sm:max-w-[75%] md:max-w-[65%] px-4 py-3 shadow-sm text-[15px] leading-relaxed";
        const bubbleUser = "bg-[#202020] border border-[#303030] text-white rounded-2xl rounded-tl-sm";
        
        // Internal notes get a yellow tint to distinguish them visually
        const bubbleAdmin = m.internal
          ? "bg-yellow-950/30 border border-yellow-700/40 text-white rounded-2xl rounded-tr-sm shadow-sm"
          : "bg-[#181818] border border-[#303030] text-white rounded-2xl rounded-tr-sm shadow-sm";
        const timeStr = safeTime(m.createdAt);

        return (
          <div key={m._id || m.createdAt || Math.random()} className={`w-full flex ${rowCls}`}>
            <div className={`flex flex-col ${isFromUser ? "items-start" : "items-end"} max-w-full`}>
              <div className={`text-xs ${isFromUser ? "text-left" : "text-right"} text-[#CCCCCC] mb-1 flex ${isFromUser ? "justify-start" : "justify-end"} items-center gap-2 w-full`}>
                <span className="text-white font-medium">{authorName}</span>
                {!isFromUser && m.internal && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border bg-yellow-600/20 text-yellow-300 border-yellow-700/50">
                    INTERNAL
                  </span>
                )}
              </div>
              <div className={`${bubbleBase} ${isFromUser ? bubbleUser : bubbleAdmin} relative`}>
                <div className="whitespace-pre-wrap break-words pb-4">{m.body}</div>
                {timeStr && (
                  <div className={`absolute bottom-1.5 right-3 text-[11px] font-medium ${isFromUser ? 'text-[#888888]' : (m.internal ? 'text-yellow-400/70' : 'text-[#888888]')}`}>{timeStr}</div>
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

