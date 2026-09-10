'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Check, Loader2, RotateCcw, Send, Server, FileText } from 'lucide-react';
import { TicketStatus } from '../types';
import { API_BASE, getToken } from '../utils';
import { useCurrency } from '@/hooks/useCurrency';
import { useParams } from 'next/navigation';

interface TicketDetailComposerProps {
  status:      TicketStatus;
  replyText:   string;
  replying:    boolean;
  statusBusy:  boolean;
  onTextChange:(val: string) => void;
  onSend:      () => void;
  onKeyDown:   (e: React.KeyboardEvent<any>) => void;
  onReopen:    () => void;
}

export function TicketDetailComposer({
  status, replyText, replying, statusBusy,
  onTextChange, onSend, onKeyDown, onReopen,
}: TicketDetailComposerProps) {
  const { currency } = useCurrency();
  const replyAllowed  = status === 'open' || status === 'pending';
  const editorRef = useRef<HTMLDivElement>(null);
  const { id } = useParams() as { id: string };

  const [mentionsData, setMentionsData] = useState<{servers: any[], payments: any[]} | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  useEffect(() => {
    if (replyText === '' && editorRef.current) {
      if (editorRef.current.innerHTML !== '') editorRef.current.innerHTML = '';
    }
  }, [replyText]);

  // Prefetch mentions data on mount so it's ready when user types @
  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/api/tickets/${id}/mentions`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => res.json())
      .then(d => setMentionsData(d))
      .catch(() => setMentionsData({ servers: [], payments: [] }));
  }, [id]);

  const handleInput = () => {
    if (!editorRef.current) return;
    
    function getRawText(node: Node): string {
      let text = '';
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          if (el.tagName === 'SPAN' && el.dataset.type) {
            text += `[@${el.dataset.type}:${el.dataset.id}:${el.dataset.name}]`;
          } else if (el.tagName === 'DIV' || el.tagName === 'P') {
            text += '\n' + getRawText(el);
          } else if (el.tagName === 'BR') {
            text += '\n';
          } else {
            text += getRawText(el);
          }
        }
      }
      return text;
    }
    
    let parsedText = getRawText(editorRef.current);
    if (parsedText.startsWith('\n')) parsedText = parsedText.substring(1);
    
    const match = parsedText.match(/@([a-zA-Z0-9_-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
    
    onTextChange(parsedText);
  };

  const insertMentionPill = (type: string, itemId: string, name: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent || '';
        const match = text.slice(0, range.startOffset).match(/@[a-zA-Z0-9_-]*$/);
        if (match) {
          range.setStart(textNode, range.startOffset - match[0].length);
          range.deleteContents();
        }
      }
      
      const el = document.createElement('span');
      el.contentEditable = 'false';
      el.dataset.type = type;
      el.dataset.id = itemId;
      el.dataset.name = name;
      el.className = type === 'server' 
        ? 'inline-flex items-center align-middle font-medium rounded px-1.5 py-0.5 mx-0.5 bg-[#FF5722]/10 text-[#FF5722]'
        : 'inline-flex items-center align-middle font-medium rounded px-1.5 py-0.5 mx-0.5 bg-emerald-500/10 text-emerald-400';
      el.innerHTML = type === 'server'
        ? `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" stroke-width="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2" stroke-width="2"></rect><line x1="6" y1="6" x2="6.01" y2="6" stroke-width="2"></line><line x1="6" y1="18" x2="6.01" y2="18" stroke-width="2"></line></svg>${name}`
        : `<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>${name}`;
      
      range.insertNode(el);
      range.setStartAfter(el);
      
      const space = document.createTextNode('\u00A0'); 
      range.insertNode(space);
      range.setStartAfter(space);
      range.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    handleInput();
    setMentionQuery(null);
  };

  if (!replyAllowed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <Check size={14} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white/50">This ticket is {status}.</span>
          <span className="text-xs text-white/30">Replies are currently disabled.</span>
        </div>
        <button
          onClick={onReopen}
          disabled={statusBusy}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw size={14} /> Reopen ticket
        </button>
      </div>
    );
  }

  let filteredServers = mentionsData?.servers || [];
  let filteredPayments = mentionsData?.payments || [];
  
  if (mentionQuery) {
    filteredServers = filteredServers.filter(s => s.name.toLowerCase().includes(mentionQuery) || s.identifier?.toLowerCase().includes(mentionQuery));
    filteredPayments = filteredPayments.filter(p => p._id.toLowerCase().includes(mentionQuery) || 'invoice'.includes(mentionQuery) || `invoice #${p._id.slice(-6).toLowerCase()}`.includes(mentionQuery));
  }

  return (
    <div className="relative flex items-end gap-3 rounded-[24px] bg-[#222222] pl-5 pr-3 py-2.5">
      {mentionQuery !== null && (
        <div className="absolute bottom-full mb-2 left-0 w-80 max-h-64 overflow-y-auto rounded-xl border border-white/[0.05] bg-[#1a1a1a] p-2 shadow-2xl z-50">
          {!mentionsData ? (
            <div className="p-3 text-center text-xs text-white/40 flex items-center justify-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Loading...
            </div>
          ) : filteredServers.length === 0 && filteredPayments.length === 0 ? (
            <div className="p-3 text-center text-xs text-white/40">No matches found</div>
          ) : (
            <>
              {filteredServers.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">Servers</div>
                  {filteredServers.map(s => (
                    <button
                      key={s._id}
                      onClick={() => insertMentionPill('server', s._id, s.name)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <Server size={14} className="text-[#FF5722]" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/80">{s.name}</span>
                        <span className="text-[10px] text-white/40 font-mono">{s.identifier || s._id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {filteredPayments.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">Invoices</div>
                  {filteredPayments.map(p => (
                    <button
                      key={p._id}
                      onClick={() => insertMentionPill('invoice', p._id, `Invoice #${p._id.slice(-6).toUpperCase()}`)}
                      className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                    >
                      <FileText size={14} className="text-emerald-400" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/80">Invoice #{p._id.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-white/40">{p.amount} {p.currency || currency} • {new Date(p.createdAt).toLocaleDateString()}</span>
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
          data-placeholder="Type a message (use @ to link servers or invoices)"
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