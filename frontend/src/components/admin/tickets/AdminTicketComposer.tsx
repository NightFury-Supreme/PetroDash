'use client';

import React, { useRef, useEffect } from 'react';
import { Loader2, Send, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from '@/i18n/routing';
import { useCurrency } from '@/hooks/useCurrency';
import { useTicketMentions } from '@/hooks/tickets';
import { TicketMentionsDropdown } from '@/components/tickets/TicketMentionsDropdown';

interface AdminTicketComposerProps {
  replyText:        string;
  replying:         boolean;
  internal:         boolean;
  canSend:          boolean;
  onTextChange:     (val: string) => void;
  onSend:           () => void;
  onKeyDown:        (e: React.KeyboardEvent<HTMLElement>) => void;
  onToggleInternal: () => void;
}

export function AdminTicketComposer({
  replyText, replying, internal, canSend,
  onTextChange, onSend, onKeyDown, onToggleInternal,
}: AdminTicketComposerProps) {
  const t = useTranslations('AdminTickets');
  const tTickets = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const { currency } = useCurrency();
  const editorRef = useRef<HTMLDivElement>(null);
  const { id } = useParams() as { id: string };

  const {
    mentionsData,
    mentionQuery,
    filteredServers,
    filteredPayments,
    handleInput,
    insertMentionPill,
  } = useTicketMentions(editorRef, onTextChange, id);

  useEffect(() => {
    if (replyText === '' && editorRef.current) {
      if (editorRef.current.innerHTML !== '') editorRef.current.innerHTML = '';
    }
  }, [replyText]);

  if (!canSend) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Lock size={14} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white/50">{t('ticketDeleted')}</span>
          <span className="text-xs text-white/30">{t('repliesDisabledDeleted')}</span>
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
      <TicketMentionsDropdown
        mentionsData={mentionsData}
        mentionQuery={mentionQuery}
        filteredServers={filteredServers}
        filteredPayments={filteredPayments}
        currency={currency}
        onSelectMention={insertMentionPill}
      />

      <div className="flex flex-1 flex-col justify-end">
        <div
          ref={editorRef}
          contentEditable={!replying}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (mentionQuery !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter')) {
              if (e.key === 'Enter') e.preventDefault();
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            } else {
              onKeyDown(e);
            }
          }}
          className={`w-full overflow-y-auto bg-transparent py-2 pl-1 text-sm leading-[1.6] outline-none min-h-[36px] max-h-[128px] break-words whitespace-pre-wrap ${replying ? 'opacity-50' : ''} ${
            internal ? 'text-yellow-100' : 'text-white/90'
          }`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}
          data-placeholder={internal ? t('writeInternalNotePlaceholder') : t('typeReplyPlaceholder')}
        />
        <style dangerouslySetInnerHTML={{__html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: ${internal ? '#a16207' : '#888888'};
            pointer-events: none;
            display: block;
          }
        `}} />
        <div className="flex items-center justify-between pb-1.5 pr-2">
          <button
            type="button"
            onClick={onToggleInternal}
            disabled={replying}
            className={`flex items-center gap-1.5 rounded-full pl-1 py-1 text-[11px] font-medium transition-colors ${
              internal
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-[#555] hover:text-[#aaa]'
            }`}
          >
            {internal ? <EyeOff size={11} className="shrink-0" /> : <Eye size={11} className="shrink-0" />}
            {internal ? t('internalNote') : t('publicReply')}
          </button>

          <span className={`text-[10px] font-medium ${overLimit ? 'text-red-400' : 'text-[#555555]'}`}>
            {replyText.length} / 5000
          </span>
        </div>
      </div>

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
