'use client';
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Server, FileText, Ticket } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { API_BASE, getToken } from './utils';
import { useCurrency } from '@/hooks/useCurrency';

export interface CreateTicketDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  setTitle: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  categories: string[];
  loading: boolean;
  onSubmit: () => void;
}

export function CreateTicketDrawer({
  open, onOpenChange,
  title, setTitle,
  message, setMessage,
  category, setCategory,
  priority, setPriority,
  categories, loading, onSubmit
}: CreateTicketDrawerProps) {
  const { currency } = useCurrency();
  const editorRef = useRef<HTMLDivElement>(null);

  const [mentionsData, setMentionsData] = useState<{servers: any[], payments: any[]} | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Sync external clear
  useEffect(() => {
    if (message === '' && editorRef.current) {
      if (editorRef.current.innerHTML !== '') editorRef.current.innerHTML = '';
    }
  }, [message]);

  // Prefetch mentions data on mount so it's ready when user types @
  useEffect(() => {
    fetchWithRetry(`${API_BASE}/api/tickets/mentions/search`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => res.json())
      .then(d => setMentionsData(d))
      .catch(() => setMentionsData({ servers: [], payments: [] }));
  }, []);

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
    
    setMessage(parsedText);
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
      el.className = 'inline-flex items-center gap-1 bg-[#FF5722]/20 text-[#FF5722] px-1.5 py-0.5 rounded text-xs mx-1 align-middle whitespace-nowrap select-none';
      
      const icon = document.createElement('span');
      icon.innerHTML = type === 'server' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>' : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
      icon.className = 'w-2.5 h-2.5';
      
      const textSpan = document.createElement('span');
      textSpan.textContent = name;
      
      el.appendChild(icon);
      el.appendChild(textSpan);
      
      range.insertNode(el);
      
      const space = document.createTextNode('\u00A0');
      range.setStartAfter(el);
      range.setEndAfter(el);
      range.insertNode(space);
      range.setStartAfter(space);
      range.collapse(true);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      setMentionQuery(null);
      handleInput();
    }
  };

  let filteredServers = mentionsData?.servers || [];
  let filteredPayments = mentionsData?.payments || [];
  if (mentionQuery) {
    filteredServers = filteredServers.filter(s => s.name.toLowerCase().includes(mentionQuery) || s.identifier.toLowerCase().includes(mentionQuery));
    filteredPayments = filteredPayments.filter(p => p._id.toLowerCase().includes(mentionQuery) || 'invoice'.includes(mentionQuery) || `invoice #${p._id.slice(-6).toLowerCase()}`.includes(mentionQuery));
  }

  return (
    <Drawer
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="New Support Ticket"
      subtitle="Open a new request"
      icon={<Ticket className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !title.trim() || !message.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6939] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            Create Ticket
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
            Subject <span className="text-[#FF5722]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] outline-none transition-colors focus:border-[#FF5722]/60 placeholder:text-[#555]"
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              Category <span className="text-[#FF5722]">*</span>
            </label>
            <CustomSelect 
              value={category} 
              onChange={setCategory}
              options={categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))} 
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              Priority <span className="text-[#FF5722]">*</span>
            </label>
            <CustomSelect 
              value={priority} 
              onChange={setPriority}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' }
              ]} 
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
            Message <span className="text-[#FF5722]">*</span>
          </label>
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, text); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { document.execCommand('insertLineBreak'); e.preventDefault(); } }}
              className="min-h-[150px] max-h-[300px] w-full overflow-y-auto rounded-lg border border-[#222] bg-[#161616] p-4 text-sm text-[#D4D4D4] outline-none transition-colors focus:border-[#FF5722]/60 focus:bg-[#1A1A1A] whitespace-pre-wrap break-words"
              data-placeholder="Describe your issue in detail. Use @ to mention a server or invoice..."
            />
            {message.length === 0 && (
              <div className="pointer-events-none absolute left-4 top-4 text-sm text-[#555]">
                Describe your issue in detail. Use @ to mention a server or invoice...
              </div>
            )}
            
            {mentionQuery !== null && (
              <div className="absolute z-50 mt-2 w-full max-w-[300px] rounded-lg border border-[#333] bg-[#161616] shadow-xl overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredServers.length > 0 && (
                    <div className="py-1">
                      <div className="px-3 py-1 text-xs font-semibold text-[#888] uppercase tracking-wider">Servers</div>
                      {filteredServers.map(s => (
                        <button key={s._id} type="button" onClick={() => insertMentionPill('server', s._id, s.name)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#222] transition-colors">
                          <Server size={14} className="text-[#888]" />
                          <span className="truncate">{s.name}</span>
                          <span className="text-xs text-[#555] ml-auto font-mono">{s.identifier}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredPayments.length > 0 && (
                    <div className="py-1 border-t border-[#333]">
                      <div className="px-3 py-1 text-xs font-semibold text-[#888] uppercase tracking-wider">Invoices</div>
                      {filteredPayments.map(p => (
                        <button key={p._id} type="button" onClick={() => insertMentionPill('invoice', p._id, `Invoice #${p._id.slice(-6)}`)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D4D4D4] hover:bg-[#222] transition-colors">
                          <FileText size={14} className="text-[#888]" />
                          <span className="truncate font-mono">Invoice #{p._id.slice(-6)}</span>
                          <span className="text-xs text-[#555] ml-auto">{currency.symbol}{(p.amount/100).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredServers.length === 0 && filteredPayments.length === 0 && (
                    <div className="px-3 py-3 text-sm text-[#888] text-center">No matches found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[#888]">
            Be as descriptive as possible. If this relates to a specific service, type <code className="bg-[#222] px-1 py-0.5 rounded text-[#D4D4D4]">@</code> to mention it.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

function CustomSelect({ value, options, onChange }: { value: string, options: {label: string, value: string}[], onChange: (v: string)=>void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] outline-none transition-colors focus:border-[#FF5722]/60 appearance-none"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
