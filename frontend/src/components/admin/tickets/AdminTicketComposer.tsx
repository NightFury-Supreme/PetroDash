'use client';

import React from 'react';
import { Loader2, Send } from 'lucide-react';

interface AdminTicketComposerProps {
  replyText:        string;
  replying:         boolean;
  internal:         boolean;
  canSend:          boolean;
  onTextChange:     (val: string) => void;
  onSend:           () => void;
  onKeyDown:        (e: React.KeyboardEvent<any>) => void;
  onToggleInternal: () => void;
}

export function AdminTicketComposer({
  replyText, replying, internal, canSend,
  onTextChange, onSend, onKeyDown, onToggleInternal,
}: AdminTicketComposerProps) {
  
  if (!canSend) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <i className="fas fa-lock text-xs" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white/50">This ticket was deleted.</span>
          <span className="text-xs text-white/30">Replies are disabled for deleted tickets.</span>
        </div>
      </div>
    );
  }

  const overLimit = replyText.length > 5000;
  
  return (
    <div className={`relative flex items-end gap-3 rounded-[24px] pl-5 pr-3 py-2.5 transition-colors ${
      internal
        ? 'bg-yellow-950/40 border border-yellow-700/30'
        : 'bg-[#222222]'
    }`}>
      {/* Editor + char count */}
      <div className="flex flex-1 flex-col justify-end pt-1">
        <textarea
          value={replyText}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            } else {
              onKeyDown(e);
            }
          }}
          placeholder={internal ? 'Write an internal note…' : 'Type a reply…'}
          className={`w-full resize-none overflow-y-auto bg-transparent py-2 pl-1 text-sm leading-[1.6] outline-none min-h-[36px] max-h-[128px] break-words whitespace-pre-wrap ${replying ? 'opacity-50' : ''} ${
            internal ? 'text-yellow-100 placeholder:text-yellow-700/50' : 'text-white/90 placeholder:text-white/40'
          }`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}
        />
        <div className="flex items-center justify-between pb-1.5 pr-2">
          {/* Internal toggle */}
          <button
            type="button"
            onClick={onToggleInternal}
            className={`flex items-center gap-1.5 rounded-full pl-1 py-1 text-[11px] font-medium transition-colors ${
              internal
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-[#555] hover:text-[#aaa]'
            }`}
          >
            <i className={internal ? 'fas fa-eye-slash text-[10px]' : 'fas fa-eye text-[10px]'} />
            {internal ? 'Internal note' : 'Public reply'}
          </button>

          {/* Char count */}
          <span className={`text-[10px] font-medium ${overLimit ? 'text-red-400' : 'text-[#555555]'}`}>
            {replyText.length} / 5000
          </span>
        </div>
      </div>

      {/* Send button */}
      <div className="flex shrink-0 items-end mb-0.5">
        <button
          onClick={onSend}
          disabled={replying || !replyText.trim() || overLimit}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
            !replyText.trim() || overLimit
              ? 'bg-[#333333] text-[#888888]'
              : internal
                ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                : 'bg-[#FF5722] text-white hover:bg-[#FF6B32]'
          } ${replying ? 'opacity-50' : ''}`}
        >
          {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} className="mr-0.5 mt-0.5" />}
        </button>
      </div>
    </div>
  );
}
