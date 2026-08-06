"use client";

import React from "react";

const MAX_LEN = 5000;

export default function AdminTicketInputBar({
  contentPadding,
  value,
  internal,
  canSend,
  onChange,
  onToggleInternal,
  onSend,
}: {
  contentPadding: number;
  value: string;
  internal: boolean;
  canSend: boolean;
  onChange: (v: string) => void;
  onToggleInternal: () => void;
  onSend: () => void;
}) {
  if (!canSend) return null;

  const remaining = MAX_LEN - value.length;
  const overLimit = remaining < 0;

  return (
    <div className="fixed right-0 bottom-0 bg-[#0A0A0A]/80 backdrop-blur-md border-t border-[#202020] z-10" style={{ left: contentPadding }}>
      <div className="max-w-4xl mx-auto w-full p-4">
        <div className={`flex items-end gap-2 bg-[#1A1A1A] border rounded-2xl px-4 py-2 shadow-inner transition-colors ${overLimit ? "border-red-600/60" : internal ? "border-yellow-700/40" : "border-[#333333] focus-within:border-[#555555]"}`}>
          <div className="flex-1 flex flex-col gap-1 pt-1">
            <textarea
              value={value}
              onChange={e => {
                if (e.target.value.length <= MAX_LEN + 200) {
                  onChange(e.target.value);
                  e.currentTarget.style.height = "0px";
                  e.currentTarget.style.height = Math.min(140, e.currentTarget.scrollHeight) + "px";
                }
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!overLimit && value.trim()) onSend();
                }
              }}
              placeholder={internal ? "Write an internal note... (Admins only)" : "Type your reply..."}
              className={`w-full bg-transparent resize-none outline-none py-1.5 text-sm ${internal ? "placeholder:text-yellow-700/50 text-yellow-50" : "placeholder:text-[#777] text-white"}`}
              style={{ minHeight: "40px" }}
            />
          </div>
          <div className="flex items-center gap-2 pb-1.5">
            <span className={`text-[10px] ${overLimit ? "text-red-400" : "text-[#777]"}`}>
              {remaining}
            </span>
            <button
              type="button"
              onClick={onToggleInternal}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${internal ? "bg-yellow-600/20 text-yellow-400" : "text-[#777] hover:bg-[#303030] hover:text-white"}`}
              title="Toggle Internal Note"
            >
              <i className="fas fa-eye-slash text-sm" />
            </button>
            <button
              onClick={onSend}
              disabled={overLimit || !value.trim()}
              className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 shadow-sm transition-colors"
            >
              <i className="fas fa-paper-plane text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
