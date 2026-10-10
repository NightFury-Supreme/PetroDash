'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Loader2, Server, FileText, Ticket } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { API_BASE, getToken } from './utils';
import { useCurrency } from '@/hooks/useCurrency';

export interface CreateTicketDrawerProps {
  title:            string;
  message:          string;
  category:         string;
  priority:         string;
  categories:       string[];
  creating:         boolean;
  onTitleChange:    (v: string) => void;
  onMessageChange:  (v: string) => void;
  onCategoryChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onClose:          () => void;
  onCreate:         () => void;
}

export function CreateTicketDrawer({
  title, message, category, priority, categories, creating,
  onTitleChange, onMessageChange, onCategoryChange, onPriorityChange,
  onClose, onCreate,
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
    fetch(`${API_BASE}/api/tickets/mentions/search`, {
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
    
    onMessageChange(parsedText);
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
        ? 'inline-flex items-center align-middle font-semibold text-[#FF5722]'
        : 'inline-flex items-center align-middle font-semibold text-emerald-400';
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

  let filteredServers = mentionsData?.servers || [];
  let filteredPayments = mentionsData?.payments || [];
  
  if (mentionQuery) {
    filteredServers = filteredServers.filter(s => s.name.toLowerCase().includes(mentionQuery) || s.identifier?.toLowerCase().includes(mentionQuery));
    filteredPayments = filteredPayments.filter(p => p._id.toLowerCase().includes(mentionQuery) || 'invoice'.includes(mentionQuery) || `invoice #${p._id.slice(-6).toLowerCase()}`.includes(mentionQuery));
  }

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="New Support Ticket"
      subtitle="Open a new request"
      icon={<Ticket className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg border px-5 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-[#FF5722] border-[#FF5722] hover:bg-[#F4511E]`}
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Ticket'}
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        <Field label="Subject">
          <input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Brief description of your issue"
            className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <CustomSelect
              value={category}
              onChange={onCategoryChange}
              options={categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))}
            />
          </Field>

          <Field label="Priority">
            <CustomSelect
              value={priority}
              onChange={onPriorityChange}
              options={[
                { label: 'Low', value: 'low' },
                { label: 'Normal', value: 'normal' },
                { label: 'High', value: 'high' }
              ]}
            />
          </Field>
        </div>

        <Field label="Message">
          <div className="relative">
            {mentionQuery !== null && (
              <div className="absolute bottom-full mb-2 left-0 w-80 max-h-64 overflow-y-auto rounded-xl border border-[#2A2A2A] bg-[#161616] p-2 shadow-2xl z-50">
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
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">Servers</div>
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
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">Invoices</div>
                        {filteredPayments.map(p => (
                          <button
                            key={p._id}
                            onClick={() => insertMentionPill('invoice', p._id, `Invoice #${p._id.slice(-6).toUpperCase()}`)}
                            className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                          >
                            <FileText size={14} className="text-emerald-400" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white/80">Invoice #${p._id.slice(-6).toUpperCase()}</span>
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
            
            <div
              ref={editorRef}
              contentEditable={!creating}
              onInput={handleInput}
              onKeyDown={(e) => {
                if (mentionQuery !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter')) {
                  if (e.key === 'Enter') e.preventDefault(); 
                }
              }}
              className={`w-full overflow-y-auto rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm leading-[1.6] text-[#D4D4D4] outline-none min-h-[120px] max-h-[300px] break-words whitespace-pre-wrap transition-colors focus:border-[#FF5722]/60 ${creating ? 'opacity-50' : ''}`}
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#555 transparent' }}
              data-placeholder="Describe your issue in detail… (use @ to link servers or invoices)"
            />
            <style dangerouslySetInnerHTML={{__html: `
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #555;
                pointer-events: none;
                display: block;
              }
            `}} />
          </div>
        </Field>
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {

  return (
    <div className="mb-2 mt-5 block">
      <label className="mb-2 block text-sm font-medium text-[#D4D4D4] capitalize">
        {label} <span className="text-[#FF5722]">*</span>
      </label>
      {children}
    </div>
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
