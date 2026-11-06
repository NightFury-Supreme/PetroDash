'use client';

import React from 'react';
import { Loader2, Server, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MentionServer, MentionPayment } from '@/hooks/tickets';

interface TicketMentionsDropdownProps {
  mentionsData: { servers: MentionServer[]; payments: MentionPayment[] } | null;
  mentionQuery: string | null;
  filteredServers: MentionServer[];
  filteredPayments: MentionPayment[];
  currency: string;
  onSelectMention: (type: 'server' | 'invoice', id: string, name: string) => void;
  className?: string;
}

export function TicketMentionsDropdown({
  mentionsData,
  mentionQuery,
  filteredServers,
  filteredPayments,
  currency,
  onSelectMention,
  className = '',
}: TicketMentionsDropdownProps) {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');

  if (mentionQuery === null) return null;

  return (
    <div
      className={`absolute bottom-full mb-2 left-0 w-80 max-h-64 overflow-y-auto rounded-xl border border-white/[0.05] bg-[#1a1a1a] p-2 shadow-2xl z-50 ${className}`}
    >
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
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                {t('servers')}
              </div>
              {filteredServers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectMention('server', s.id, s.name)}
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                >
                  <Server size={14} className="text-[#FF5722]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white/80">{s.name}</span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {s.identifier || s.id}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {filteredPayments.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/30">
                {t('invoices')}
              </div>
              {filteredPayments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    onSelectMention('invoice', p.id, `${t('invoiceLabel')}${p.id.slice(-6).toUpperCase()}`)
                  }
                  className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors"
                >
                  <FileText size={14} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white/80">
                      {t('invoiceLabel')}{p.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {p.amount} {currency}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
