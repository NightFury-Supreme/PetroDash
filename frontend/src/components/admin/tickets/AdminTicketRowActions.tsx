'use client';

import React from 'react';
import { CheckCircle2, Inbox, RotateCcw, ShieldOff, XCircle, Loader2 } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
import { useTranslations } from 'next-intl';
import type { AdminTicketItemData } from '@/hooks/admin/tickets/types';

interface AdminTicketRowActionsProps {
  ticket: AdminTicketItemData;
  onAction: (action: 'close' | 'resolve' | 'delete' | 'restore' | 'reopen', id: string) => Promise<void>;
  actionBusy?: string | null;
}

export function AdminTicketRowActions({
  ticket,
  onAction,
  actionBusy,
}: AdminTicketRowActionsProps) {
  const tr = useTranslations('AdminTickets');
  const isBusy = Boolean(actionBusy);

  return (
    <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
      <div className="flex lg:justify-end gap-2">
        {!ticket.deletedByUser ? (
          <>
            {ticket.status === 'closed' || ticket.status === 'resolved' ? (
              <RowActionButton
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('reopen', ticket.id);
                }}
                disabled={isBusy}
                title={tr('reopenTicket')}
              >
                {actionBusy === 'reopen' ? (
                  <Loader2 size={15} className="animate-spin text-white/70" />
                ) : (
                  <Inbox size={15} />
                )}
              </RowActionButton>
            ) : (
              <>
                <RowActionButton
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('resolve', ticket.id);
                  }}
                  disabled={isBusy}
                  title={tr('resolveTicket')}
                >
                  {actionBusy === 'resolve' ? (
                    <Loader2 size={15} className="animate-spin text-white/70" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                </RowActionButton>
                <RowActionButton
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('close', ticket.id);
                  }}
                  disabled={isBusy}
                  title={tr('closeTicket')}
                >
                  {actionBusy === 'close' ? (
                    <Loader2 size={15} className="animate-spin text-white/70" />
                  ) : (
                    <XCircle size={15} />
                  )}
                </RowActionButton>
              </>
            )}
            <RowActionButton
              variant="default"
              onClick={(e) => {
                e.stopPropagation();
                onAction('delete', ticket.id);
              }}
              disabled={isBusy}
              title={tr('softDelete')}
            >
              {actionBusy === 'delete' ? (
                <Loader2 size={15} className="animate-spin text-white/70" />
              ) : (
                <ShieldOff size={15} />
              )}
            </RowActionButton>
          </>
        ) : (
          <RowActionButton
            variant="default"
            onClick={(e) => {
              e.stopPropagation();
              onAction('restore', ticket.id);
            }}
            disabled={isBusy}
            title={tr('restoreTicket')}
          >
            {actionBusy === 'restore' ? (
              <Loader2 size={15} className="animate-spin text-white/70" />
            ) : (
              <RotateCcw size={15} />
            )}
          </RowActionButton>
        )}
      </div>
    </div>
  );
}

export default AdminTicketRowActions;
