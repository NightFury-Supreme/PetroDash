"use client";

import React, { useState } from "react";

const MAX_LEN = 5000;

export default function TicketInputBar({
  contentPadding,
  disabled = false,
  isClosed = false,
  isResolved = false,
  statusUpdating = false,
  onReopen,
  onSend,
}: {
  contentPadding: number;
  disabled?: boolean;
  isClosed?: boolean;
  isResolved?: boolean;
  statusUpdating?: boolean;
  onReopen?: () => void;
  onSend: (text: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!value.trim() || disabled) return;
    setSending(true);
    try {
      await onSend(value.trim());
      setValue("");
    } finally {
      setSending(false);
    }
  };

  const remaining = MAX_LEN - value.length;
  const canSend = !disabled && !sending && value.trim().length > 0 && value.length <= MAX_LEN;

  return (
    <div className="fixed right-0 bottom-0 bg-[#0A0A0A]/80 backdrop-blur-md border-t border-[#202020] z-10 flex flex-col" style={{ left: contentPadding }}>
      <div className="max-w-4xl mx-auto w-full p-4">
        {(isClosed || isResolved) && onReopen ? (
          <div className={`px-4 py-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between shadow-inner gap-3 ${isClosed ? "bg-[#1A1A1A] border-[#303030]" : "bg-blue-600/10 border-blue-600/30"}`}>
            <span className="text-sm text-[#CCCCCC]">
              {isClosed ? "This ticket is closed." : "This ticket has been resolved."}
              {" "}You can reopen it if you need further help.
            </span>
            <button
              onClick={onReopen}
              disabled={statusUpdating}
              className="px-5 py-2 text-sm bg-white hover:bg-gray-200 text-black rounded-lg font-bold disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {statusUpdating ? "Reopening..." : "Reopen Ticket"}
            </button>
          </div>
        ) : (
          <div className={`flex items-end gap-2 bg-[#1A1A1A] rounded-2xl px-4 py-2 shadow-inner transition-colors border ${remaining < 0 ? 'border-red-600/60' : 'border-[#333333] focus-within:border-[#555555]'}`}>
            <div className="flex-1 flex flex-col gap-1 pt-1">
              <textarea
                value={value}
                onChange={e => {
                  if (e.target.value.length <= MAX_LEN + 200) {
                    setValue(e.target.value);
                    e.currentTarget.style.height = "0px";
                    e.currentTarget.style.height = Math.min(140, e.currentTarget.scrollHeight) + "px";
                  }
                }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={disabled ? "You cannot send messages right now" : "Type a message (Shift+Enter for new line)"}
                disabled={disabled}
                className="w-full bg-transparent outline-none text-white placeholder-[#AAAAAA] resize-none max-h-[140px] disabled:opacity-50 py-1.5 text-sm"
                style={{ minHeight: "40px" }}
              />
              {value.length > MAX_LEN * 0.8 && (
                <div className={`text-[10px] text-right pr-1 ${remaining < 0 ? 'text-red-400' : 'text-[#AAAAAA]'}`}>
                  {remaining < 0 ? `${Math.abs(remaining)} over limit` : `${remaining} remaining`}
                </div>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-10 h-10 mb-0.5 rounded-xl bg-white hover:bg-gray-200 disabled:opacity-40 text-black flex items-center justify-center flex-shrink-0 shadow-sm transition-colors"
            >
              {sending ? <i className="fas fa-spinner animate-spin" /> : <i className="fas fa-paper-plane" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


