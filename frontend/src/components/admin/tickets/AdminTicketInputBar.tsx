"use client";

import React from "react";

const MAX_LEN = 5000;

export default function AdminTicketInputBar({
  value,
  internal,
  canSend,
  onChange,
  onToggleInternal,
  onSend,
}: {
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
    <div className="bg-[#111] p-2 sm:p-4">
      <div className={`flex flex-col gap-2 rounded-xl border p-2 transition-colors focus-within:border-[#444] ${
        overLimit ? 'border-red-500/50 bg-red-500/5' : internal ? 'border-yellow-700/40 bg-yellow-900/10' : 'border-[#222] bg-[#161616]'
      }`}>
        <textarea
          value={value}
          onChange={e => {
            if (e.target.value.length <= MAX_LEN + 200) {
              onChange(e.target.value);
              e.currentTarget.style.height = '0px';
              e.currentTarget.style.height = Math.min(140, e.currentTarget.scrollHeight) + 'px';
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!overLimit && value.trim()) onSend();
            }
          }}
          placeholder={internal ? "Write an internal note... (Admins only)" : "Type your reply..."}
          className={`w-full resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-[#555] ${internal ? 'text-yellow-100 placeholder:text-yellow-700/50' : 'text-[#E0E0E0]'}`}
          style={{ minHeight: '40px' }}
        />
        
        <div className="flex items-center justify-between px-2 pb-1">
          <span className={`text-[10px] font-medium ${overLimit ? 'text-red-400' : 'text-[#555]'}`}>
            {value.length > 0 && `${remaining} remaining`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleInternal}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
                internal ? 'bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30' : 'bg-[#222] text-[#888] hover:bg-[#333] hover:text-[#fff]'
              }`}
            >
              <i className={internal ? "fas fa-eye-slash" : "fas fa-eye"} />
              {internal ? 'Internal' : 'Public'}
            </button>
            <button
              onClick={onSend}
              disabled={overLimit || !value.trim()}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-4 text-xs font-medium text-black transition-colors hover:bg-[#e0e0e0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
