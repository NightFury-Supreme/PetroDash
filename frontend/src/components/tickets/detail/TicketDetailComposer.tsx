'use client';

import React, { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Loader2, RotateCcw, Send, Server, FileText } from 'lucide-react';
import { TicketStatus } from '../types';
import { useCurrency } from '@/hooks/useCurrency';
import { useParams } from '@/i18n/routing';
import { useTicketMentions } from '@/hooks/tickets';

interface TicketDetailComposerProps {
  status: TicketStatus;
  replyText: string;
  replying: boolean;
  statusBusy: boolean;
  onTextChange: (val: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<any>) => void;
  onReopen: () => void;
}

export function TicketDetailComposer({
  status,
  replyText,
  replying,
  statusBusy,
  onTextChange,
  onSend,
  onKeyDown,
  onReopen,
}: TicketDetailComposerProps) {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const { currency } = useCurrency();
  const replyAllowed = status === 'open' || status === 'pending';
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

  if (!replyAllowed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Check size={14} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white/50">{t('ticketStatus', { status })}</span>
          <span className="text-xs text-white/30">{t('repliesDisabled')}</span>
        </div>
        <button
          onClick={onReopen}
          disabled={statusBusy}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} /> {t('reopenTicket')}
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex items-end gap-3 rounded-[24px] bg-[#222222] pl-5 pr-3 py-2.5">
      {mentionQuery !== null && (
        <div className="absolute bottom-full mb-2 left-0 w-80 max-h-64 overflow-y-auto rounded-xl border border-white/[0.05] bg-[#1a1a1a] p-2 shadow-2xl z-50">
          {!mentionsData ? (
            <div className="p-3 text-center text-xs text-white/40 flex items-center justify-center gap-2">
              <Loader2 size={12} className="animate-spin" /> {tCommon('loading')}
            </div>
          ) : filteredServers.length === 0 && filteredPayments.length === 0 ? (
            <div className="p-3 text-center text-xs text-white/40">{t('noMatches')}</div>
          ) : (
            <>
              {filteredServers.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">{t('servers')}</div>
                  {filteredServers.map((s: any) => (
                    <button
                      key={s.id || s._id}
                      onClick={() => insertMentionPill('server', s.id || s._id, s.name)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <Server size={14} className="text-[#FF5722]" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/80">{s.name}</span>
                        <span className="text-[10px] text-white/40 font-mono">{s.identifier || s.id || s._id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {filteredPayments.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">{t('invoices')}</div>
                  {filteredPayments.map((p: any) => (
                    <button
                      key={p._id}
                      onClick={() => insertMentionPill('invoice', p._id, `Invoice #${p._id.slice(-6).toUpperCase()}`)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <FileText size={14} className="text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/80">Invoice #{p._id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-white/40">{p.amount} {p.currency || currency} • {new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

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
              onKeyDown(e as any);
            }
          }}
          className={`w-full overflow-y-auto bg-transparent py-2 pl-1 text-sm leading-[1.6] text-white/90 outline-none min-h-[36px] max-h-[128px] break-words whitespace-pre-wrap ${replying ? 'opacity-50' : ''}`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}
          data-placeholder={t('typeMessagePlaceholder')}
        />
        <style dangerouslySetInnerHTML={{__html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #888888;
            pointer-events: none;
            display: block;
          }
        `}} />
        <div className="flex justify-end pr-2 pb-1.5">
          <span className="text-[10px] font-medium text-[#555555]">
            {replyText.length} / 5000
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-end mb-0.5">
        <button
          onClick={onSend}
          disabled={replying || !replyText.trim()}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
            !replyText.trim()
              ? 'bg-[#333333] text-[#888888]'
              : 'bg-[#FF5722] text-white hover:bg-[#FF6B32]'
          } ${replying ? 'opacity-50' : ''}`}
        >
          {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} className="mr-0.5 mt-0.5" />}
        </button>
      </div>
    </div>
  );
}
